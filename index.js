"use strict";

  // ─── FCA Loader ───────────────────────────────────────────────────────────────
  let login;
  try {
    login = require("fca-unofficial");
    console.log("[FCA] Using: fca-unofficial (npm)");
  } catch {
    try {
      login = require("./fca");
      console.log("[FCA] Using: bundled ./fca");
    } catch {
      console.error("[FCA] FATAL: Neither fca-unofficial nor ./fca found!");
      process.exit(1);
    }
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
    let n = 0;
    try {
      const rows = db.prepare("SELECT * FROM custom_commands").all();
      for (const row of rows) {
        if (!buildCustomCommand) continue;
        const cmd = buildCustomCommand(row.name, row.type, row.content);
        if (cmd) { commands.set(row.name, cmd); n++; }
      }
    } catch {}
    return n;
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

    const cUser = appState.find(c => c.key === "c_user");
    if (!cUser?.value || cUser.value.includes("PASTE")) {
      console.log(chalk.red("✗ Missing c_user cookie!")); process.exit(1);
    }

    console.log(chalk.blue("\n📱 Logging in — UID: " + cUser.value + "..."));
    console.log(chalk.blue("📦 Loading commands..."));

    const commands = loadCommands();
    const customCount = loadCustomCommands(commands);
    global.commands = commands;

    const events = loadEvents();
    console.log(chalk.yellow("✅ " + commands.size + " commands | " + events.length + " events\n"));

    login(
      { appState },
      {
        listenEvents:     true,
        selfListen:       false,
        logLevel:         "silent",
        updatePresence:   false,
        forceLogin:       false,
        autoMarkDelivery: false,
        autoMarkRead:     false,
        autoReconnect:    true,
        userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
      },
      async (loginErr, api) => {
        if (loginErr) {
          const msg  = loginErr.error || loginErr.message || JSON.stringify(loginErr);
          const isChk = msg.includes("checkpoint") || loginErr.errorType === "CHECKPOINT";
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
        try { fs.writeFileSync("./appstate.json", JSON.stringify(api.getAppState(), null, 2)); console.log(chalk.green("✓ AppState saved")); } catch {}

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

        // ── Self-test: verify API actually works (delayed + retry to avoid 1357004 on fresh login) ──
        (function selfTest(attempt) {
          const delay = attempt === 1 ? 5000 : attempt === 2 ? 15000 : 30000;
          setTimeout(() => {
            api.getUserInfo(botID, (err, data) => {
              if (err) {
                const code = err.error || err.message || JSON.stringify(err);
                if (attempt < 3) {
                  console.log(chalk.yellow("[API TEST] getUserInfo attempt " + attempt + " failed (" + code + "), retrying..."));
                  selfTest(attempt + 1);
                } else {
                  console.log(chalk.yellow("[API TEST] getUserInfo unavailable after 3 attempts (" + code + ") — bot still running normally"));
                }
              } else {
                const name = data[botID]?.name || "unknown";
                console.log(chalk.green("[API TEST] getUserInfo OK — logged in as: \"" + name + "\""));
              }
            });
          }, delay);
        })(1);

        // Start keep-alive
        keepAlive.start(api, botID);

        console.log(chalk.green("\n🚀 " + config.botName + " LIVE — Prefix: \"" + config.prefix + "\"  Commands: " + commands.size + "\n"));

        // ── MQTT listener ──────────────────────────────────────────────────────
        let stopListening;
        stopListening = api.listenMqtt(async (listenErr, event) => {
          if (listenErr) {
            const msg    = listenErr.error || listenErr.message || JSON.stringify(listenErr);
            const isChk  = listenErr.errorType === "CHECKPOINT" || msg.includes("checkpoint");
            const isAuth = listenErr.res?.error === 1357004 || listenErr.res?.error === 1357001;

            global.botState.mqttConnected = false;
            global.botState.lastError = msg;

            if (isChk) {
              global.botState.checkpointActive = true;
              global.botState.checkpointUrl = listenErr.checkpointUrl || "/checkpoint/";
              console.log(chalk.red("[MQTT] CHECKPOINT — " + global.botState.checkpointUrl));
              return;
            }
            if (isAuth) {
              console.log(chalk.yellow("[MQTT] Auth err " + (listenErr.res?.error) + " — fca handling internally"));
              return;
            }
            global.botState.reconnectCount++;
            const delay = Math.min(60000, 10000 * global.botState.reconnectCount);
            console.log(chalk.yellow("[MQTT] Lost — reconnect in " + (delay/1000) + "s (#" + global.botState.reconnectCount + "): " + msg));
            try { stopListening.stopListening(() => {}); } catch {}
            keepAlive.stop();
            return setTimeout(startBot, delay);
          }

          // ── Mark MQTT as connected on first real event ─────────────────────
          if (!global.botState.mqttConnected) {
            global.botState.mqttConnected = true;
            global.botState.checkpointActive = false;
            console.log(chalk.green("[MQTT] Connected! Receiving events."));
          }

          // ── Log every event for debugging ──────────────────────────────────
          const bodyPreview = event.body ? event.body.slice(0, 70) : "";
          console.log("[EVT] type=" + event.type + " | from=" + (event.senderID || "?") + (bodyPreview ? " | body=" + bodyPreview : ""));

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
          if (!body.startsWith(threadPrefix)) {
            console.log("[MSG] no prefix — senderID:" + event.senderID + " body:" + body.slice(0,40));
            return;
          }

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
          try { stopListening.stopListening(() => {}); } catch {}
          setTimeout(() => process.exit(0), 1500);
        };
        process.once("SIGTERM", shutdown);
        process.once("SIGINT", shutdown);
      }
    );
  }

  startBot().catch(e => { console.error("Fatal:", e); process.exit(1); });
  