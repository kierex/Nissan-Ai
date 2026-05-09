"use strict";

// ─── FCA Loader ───────────────────────────────────────────────────────────────
let login;
try {
  login = require("fca-unofficial");
  if (typeof login !== "function" && typeof login.default === "function") login = login.default;
  console.log("[FCA] Using: bundled ./fca (DongDev v3)");
} catch (e) {
  console.error("[FCA] FATAL: Could not load FCA:", e.message);
  process.exit(1);
}

const fs   = require("fs");
const path = require("path");

let chalk;
try { chalk = require("chalk"); } catch { chalk = new Proxy({}, { get: () => s => s }); }

let figlet, gradient;
try { figlet   = require("figlet");          } catch {}
try { gradient = require("gradient-string"); } catch {}

const config    = require("./config.json");
const db        = require("./database/db");
const webServer = require("./web/server");
const keepAlive = require("./scripts/keepAlive");

let buildCustomCommand;
try { ({ buildCustomCommand } = require("./scripts/cmds/admin/addcmd")); } catch { buildCustomCommand = null; }

// ─── Globals ──────────────────────────────────────────────────────────────────
global.config      = config;
global.db          = db;
global.activeGames = new Map();
global.client      = null;
global.commands    = new Map();
global.startTime   = Date.now();

global.botState = {
  mqttConnected:    false,
  checkpointActive: false,
  checkpointUrl:    null,
  loginTime:        null,
  lastKeepAlive:    null,
  keepAliveOk:      null,
  reconnectCount:   0,
  lastError:        null,
};

const cooldowns = new Map();

// ─── Command + event loaders ──────────────────────────────────────────────────
function loadCommands() {
  const commands = new Map();
  function loadDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) continue;
      if (!file.endsWith(".js")) continue;
      try {
        delete require.cache[require.resolve(full)];
        const cmd = require(full);
        if (cmd?.config?.name) {
          commands.set(cmd.config.name.toLowerCase(), cmd);
          for (const alias of (cmd.config.aliases || []))
            commands.set(alias.toLowerCase(), cmd);
        }
      } catch (e) { console.log(chalk.red("  CMD ERR " + file + ": " + e.message)); }
    }
  }
  loadDir(path.join(__dirname, "scripts/cmds"));
  loadDir(path.join(__dirname, "scripts/cmds/admin"));
  return commands;
}

function loadCustomCommands(commands) {
  try {
    const rows = db.prepare("SELECT * FROM custom_commands").all();
    for (const row of rows) {
      if (!buildCustomCommand) continue;
      const cmd = buildCustomCommand(row.name, row.type, row.content);
      if (cmd) commands.set(row.name, cmd);
    }
  } catch {}
}

function loadEvents() {
  const events = [];
  const dir = path.join(__dirname, "scripts/events");
  if (!fs.existsSync(dir)) return events;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    try {
      delete require.cache[require.resolve(path.join(dir, file))];
      events.push(require(path.join(dir, file)));
    } catch (e) { console.log(chalk.red("  EVT ERR " + file + ": " + e.message)); }
  }
  return events;
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.log("");
  try {
    if (figlet && gradient) console.log(gradient.rainbow(figlet.textSync("NAV BOT", { font: "Big" })));
    else console.log(chalk.cyan("═══════════ NAV BOT ═══════════"));
  } catch { console.log("=== NAV BOT ==="); }
  const PORT = process.env.PORT || config.webPort || 3000;
  console.log(chalk.cyan("═".repeat(50)));
  console.log(chalk.yellow("  Bot: " + config.botName + "  v" + config.version));
  console.log(chalk.yellow("  Prefix: \"" + config.prefix + "\"  |  Port: " + PORT));
  console.log(chalk.cyan("═".repeat(50)));
}

// ─── Bot retry counter ────────────────────────────────────────────────────────
let retryCount = 0;

// ─── Main bot startup ─────────────────────────────────────────────────────────
async function startBot() {
  printBanner();
  webServer.start(null);
  db.initialize();

  if (!fs.existsSync("./appstate.json")) {
    console.log(chalk.red("✗ appstate.json not found!"));
    process.exit(1);
  }

  let appState;
  try { appState = JSON.parse(fs.readFileSync("./appstate.json", "utf8")); }
  catch (e) { console.log(chalk.red("✗ Invalid appstate.json: " + e.message)); process.exit(1); }

  const cUser = appState.find(c => c.key === "c_user" || c.name === "c_user");
  if (!cUser?.value || cUser.value.includes("PASTE")) {
    console.log(chalk.red("✗ Missing c_user cookie!")); process.exit(1);
  }

  console.log(chalk.blue("\n📱 Logging in — UID: " + cUser.value + "..."));
  console.log(chalk.blue("📦 Loading commands..."));

  const commands = loadCommands();
  loadCustomCommands(commands);
  global.commands = commands;

  const events = loadEvents();
  console.log(chalk.yellow("✅ " + commands.size + " commands | " + events.length + " events\n"));

  login(
    { appState },
    {
      listenEvents:     true,
      selfListen:       false,
      updatePresence:   false,
      forceLogin:       false,
      autoMarkDelivery: false,
      autoMarkRead:     false,
      autoReconnect:    true,
      online:           true,
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    },
    async (loginErr, api) => {
      if (loginErr) {
        const msg  = loginErr.error || loginErr.message || JSON.stringify(loginErr);
        const isChk = msg.toLowerCase().includes("checkpoint") || loginErr.errorType === "CHECKPOINT";
        console.log(chalk.red("\n✗ Login FAILED: " + msg));
        global.botState.lastError = msg;
        if (isChk) {
          global.botState.checkpointActive = true;
          global.botState.checkpointUrl = loginErr.checkpointUrl || "/checkpoint/";
          console.log(chalk.red("⚠  CHECKPOINT — go to Facebook and clear it, then re-deploy"));
          retryCount++;
          return setTimeout(startBot, 5 * 60 * 1000);
        }
        retryCount++;
        const delay = Math.min(60000, 5000 * retryCount);
        console.log(chalk.yellow("🔄 Retry #" + retryCount + " in " + (delay/1000) + "s..."));
        return setTimeout(startBot, delay);
      }

      // ── LOGIN SUCCESS ──────────────────────────────────────────────────────
      retryCount = 0;
      const botID = api.getCurrentUserID();
      global.client = api;
      global.botState = {
        ...global.botState,
        mqttConnected: false, checkpointActive: false,
        loginTime: Date.now(), lastError: null, reconnectCount: 0,
      };

      console.log(chalk.green("\n✓ LOGIN SUCCESS — Bot UID: " + botID));
      webServer.setApi(api);

      // Save appstate
      try {
        const fresh = api.getAppState();
        if (fresh && fresh.length) {
          fs.writeFileSync("./appstate.json", JSON.stringify(fresh, null, 2));
          console.log(chalk.green("✓ AppState saved"));
        }
      } catch {}

      // ── Self-test using getUserInfoV2 (GraphQL — no 1357004 issues) ───────
      try {
        const infoFn = api.getUserInfoV2 || api.getUserInfo;
        infoFn.call(api, botID, (err, data) => {
          if (err) {
            console.log(chalk.yellow("[API TEST] getUserInfo warning: " + (err.message || JSON.stringify(err)).slice(0, 80) + " — bot running normally"));
          } else {
            const entry = data[botID] || Object.values(data)[0] || {};
            const name = entry.name || entry.firstName || "unknown";
            console.log(chalk.green("[API TEST] OK — logged in as: \"" + name + "\""));
          }
        });
      } catch (e) {
        console.log(chalk.yellow("[API TEST] skipped: " + e.message));
      }

      // ── Wrap sendMessage to log every call + every error ──────────────────
      const _origSend = api.sendMessage.bind(api);
      api.sendMessage = function(msg, threadID, callback, msgID) {
        const preview = typeof msg === "string" ? msg.slice(0, 60) : (msg?.body || "[object]").toString().slice(0, 60);
        console.log("[SEND→] thread:" + threadID + " | " + preview);
        const wrappedCb = function(err, info) {
          if (err) {
            console.log("[SEND ERR] thread:" + threadID + " | " + JSON.stringify(err).slice(0, 250));
          } else {
            console.log("[SEND OK] thread:" + threadID + " | msgID:" + (info && info.messageID));
          }
          if (typeof callback === "function") callback(err, info);
        };
        return _origSend(msg, threadID, wrappedCb, msgID);
      };

      // Start keep-alive
      keepAlive.start(api, botID);

      console.log(chalk.green("\n🚀 " + config.botName + " LIVE — Prefix: \"" + config.prefix + "\"  Commands: " + commands.size + "\n"));

      // ── MQTT listener ──────────────────────────────────────────────────────
      const listenFn = api.listenMqtt || api.listen;
      let stopListening;
      stopListening = listenFn.call(api, async (listenErr, event) => {
        if (listenErr) {
          const msg   = listenErr.error || listenErr.message || JSON.stringify(listenErr);
          const isChk = listenErr.errorType === "CHECKPOINT" || msg.toLowerCase().includes("checkpoint");

          global.botState.mqttConnected = false;
          global.botState.lastError = msg;

          if (isChk) {
            global.botState.checkpointActive = true;
            global.botState.checkpointUrl = listenErr.checkpointUrl || "/checkpoint/";
            console.log(chalk.red("[MQTT] CHECKPOINT — " + global.botState.checkpointUrl));
            return;
          }

          // Auth / session errors — new FCA handles these internally, just log
          if (listenErr.type === "not_logged_in" || listenErr.type === "login_blocked" ||
              msg.includes("Not logged in") || msg.includes("1357001") || msg.includes("1357004")) {
            console.log(chalk.yellow("[MQTT] Session warning: " + msg.slice(0, 100) + " — FCA handling internally"));
            return;
          }

          global.botState.reconnectCount++;
          const delay = Math.min(60000, 10000 * global.botState.reconnectCount);
          console.log(chalk.yellow("[MQTT] Lost — reconnect in " + (delay/1000) + "s (#" + global.botState.reconnectCount + "): " + msg));
          try { if (stopListening && typeof stopListening.stopListening === "function") stopListening.stopListening(() => {}); } catch {}
          keepAlive.stop();
          return setTimeout(startBot, delay);
        }

        // ── Mark MQTT as connected on first real event ─────────────────────
        if (!global.botState.mqttConnected) {
          global.botState.mqttConnected = true;
          global.botState.checkpointActive = false;
          console.log(chalk.green("[MQTT] Connected! Receiving events."));
        }

        if (!event || !event.type) return;

        // ── Log message events for debugging ──────────────────────────────
        if (event.type === "message" || event.type === "message_reply") {
          const bodyPreview = event.body ? event.body.slice(0, 70) : "";
          console.log("[EVT] type=" + event.type + " | from=" + (event.senderID || "?") + (bodyPreview ? " | body=" + bodyPreview : ""));
        }

        // ── Run event modules ──────────────────────────────────────────────
        for (const evt of events) {
          try { if (typeof evt.run === "function") await evt.run({ api, event, db, config, commands }); }
          catch (e) { console.log("[EVT ERR] " + (evt.config?.name || "?") + ": " + e.message); }
        }

        // ── Only handle message/message_reply ─────────────────────────────
        if (event.type !== "message" && event.type !== "message_reply") return;
        if (!event.body) return;
        if (event.senderID === botID) return;

        // ── Prefix check ──────────────────────────────────────────────────
        let threadPrefix = config.prefix;
        try { const t = db.getThread(event.threadID); if (t?.prefix) threadPrefix = t.prefix; } catch {}

        const body = event.body.trim();
        if (!body.startsWith(threadPrefix)) return;

        const parts   = body.slice(threadPrefix.length).trim().split(/\s+/);
        const cmdName = parts[0].toLowerCase();
        const args    = parts.slice(1);
        if (!cmdName) return;

        const cmd = commands.get(cmdName);
        if (!cmd) {
          console.log("[CMD] NOT FOUND: \"" + cmdName + "\" from " + event.senderID);
          return;
        }

        console.log(chalk.cyan("[CMD] " + cmdName + " from " + event.senderID + " in " + event.threadID));

        // Cooldown
        const uid    = event.senderID;
        const now    = Date.now();
        const cdKey  = uid + "-" + cmd.config.name;
        const cdTime = ((cmd.config.cooldown !== undefined ? cmd.config.cooldown : config.cooldown) || 3) * 1000;
        if (cooldowns.has(cdKey)) {
          const rem = cooldowns.get(cdKey) - now;
          if (rem > 0) {
            api.sendMessage("⏳ Wait " + (rem/1000).toFixed(1) + "s before using " + threadPrefix + cmd.config.name + " again.", event.threadID);
            return;
          }
        }

        // Ban check
        try {
          const ban = db.prepare("SELECT banned FROM users WHERE uid = ?").get(uid);
          if (ban?.banned === 1) { api.sendMessage("🚫 You are banned from this bot.", event.threadID); return; }
        } catch {}

        // Admin check
        if (cmd.config.adminOnly && !config.adminBot.includes(uid)) {
          api.sendMessage("⛔ This command is admin-only.", event.threadID);
          return;
        }

        cooldowns.set(cdKey, now + cdTime);
        setTimeout(() => cooldowns.delete(cdKey), cdTime);

        // Stats
        try {
          db.incrementStat("total_commands");
          db.incrementStat("total_messages");
          db.getUser(uid);
          db.prepare("UPDATE users SET total_messages = total_messages + 1, last_seen = datetime('now') WHERE uid = ?").run(uid);
        } catch {}

        // Run command
        try {
          console.log("[RUN] " + cmdName + "...");
          await cmd.run({ api, event, args, db, config, commands, threadPrefix });
          console.log("[RUN] " + cmdName + " done");
        } catch (e) {
          console.log(chalk.red("[RUN ERR] " + cmdName + ": " + (e.stack || e.message)));
          try { api.sendMessage("❌ Error in " + cmdName + ": " + e.message, event.threadID); } catch {}
        }
      });

      // ── Graceful shutdown ──────────────────────────────────────────────────
      const shutdown = () => {
        console.log(chalk.yellow("\n🛑 Shutting down — saving appstate..."));
        keepAlive.stop();
        keepAlive.saveAppState();
        try { if (stopListening && typeof stopListening.stopListening === "function") stopListening.stopListening(() => {}); } catch {}
        setTimeout(() => process.exit(0), 1500);
      };
      process.once("SIGTERM", shutdown);
      process.once("SIGINT", shutdown);
    }
  );
}

startBot().catch(e => { console.error("Fatal:", e); process.exit(1); });
