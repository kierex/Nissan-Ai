"use strict";
// !addcmd <name> | <response>
// !addcmd <name> | --eval <js code>
// Saved permanently to DB. Bot reloads it live without restart.
module.exports = {
  config: {
    name: "addcmd",
    aliases: ["newcmd", "createcmd"],
    description: "Add a custom command permanently (saved to database)",
    usage: "addcmd <name> | <response text>\naddcmd <name> | --eval <js code>",
    cooldown: 3,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db, config, commands }) => {
    const full = (event.body || "").slice(config.prefix.length).replace(/^addcmd\s*/i, "").trim();
    const sepIdx = full.indexOf("|");
    if (sepIdx === -1) {
      return api.sendMessage(
        `📝 ADD CUSTOM COMMAND\n${"─".repeat(28)}\n` +
        `Usage:\n` +
        `${config.prefix}addcmd <name> | <response>\n` +
        `${config.prefix}addcmd <name> | --eval <js code>\n\n` +
        `Text variables:\n` +
        `  {sender}  → sender name\n` +
        `  {uid}     → sender UID\n` +
        `  {prefix}  → bot prefix\n` +
        `  {botname} → bot name\n` +
        `  {args}    → message args\n\n` +
        `Examples:\n` +
        `${config.prefix}addcmd hi | Hello {sender}! Welcome 👋\n` +
        `${config.prefix}addcmd time | --eval api.sendMessage('🕐 ' + new Date().toLocaleString(), event.threadID)`,
        event.threadID
      );
    }

    const cmdName = full.slice(0, sepIdx).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const body    = full.slice(sepIdx + 1).trim();

    if (!cmdName || cmdName.length < 2) return api.sendMessage("❌ Command name must be 2+ letters (a-z, 0-9, - _)", event.threadID);
    if (!body)    return api.sendMessage("❌ Response/code cannot be empty!", event.threadID);
    if (cmdName.length > 30) return api.sendMessage("❌ Command name too long (max 30 chars)", event.threadID);

    // Block overwriting built-in commands
    const builtins = ["addcmd","removecmd","help","register","balance","daily","admin","ban","unban","broadcast","setprefix","addcoins"];
    if (builtins.includes(cmdName)) {
      return api.sendMessage(`❌ Cannot overwrite built-in command "${cmdName}"!`, event.threadID);
    }

    const isEval = body.startsWith("--eval ");
    const code   = isEval ? body.slice(7).trim() : null;
    const text   = isEval ? null : body;

    // Save to DB (table already created in db.initialize())
    db.prepare("INSERT OR REPLACE INTO custom_commands (name, type, content, added_by) VALUES (?, ?, ?, ?)")
      .run(cmdName, isEval ? "eval" : "text", isEval ? code : text, event.senderID);

    // Register live into commands map
    const newCmd = buildCustomCommand(cmdName, isEval ? "eval" : "text", isEval ? code : text);
    commands.set(cmdName, newCmd);

    api.sendMessage(
      `✅ COMMAND ADDED!\n${"─".repeat(26)}\n` +
      `📌 Name: ${config.prefix}${cmdName}\n` +
      `📂 Type: ${isEval ? "⚙️ Code (eval)" : "💬 Text response"}\n` +
      `💾 Saved: Permanently in database\n` +
      `🔄 Live: Active immediately (no restart)\n\n` +
      `Test it: ${config.prefix}${cmdName}`,
      event.threadID
    );
  }
};

function buildCustomCommand(name, type, content) {
  return {
    config: {
      name,
      description: `Custom command: ${name}`,
      usage: name,
      cooldown: 2,
      category: "custom",
      isCustom: true
    },
    run: async ({ api, event, args, db, config }) => {
      try {
        db.prepare("UPDATE custom_commands SET use_count = use_count + 1 WHERE name = ?").run(name);
      } catch {}

      if (type === "eval") {
        try {
          await eval(`(async () => { ${content} })()`);
        } catch (e) {
          api.sendMessage(`❌ Custom cmd error: ${e.message}`, event.threadID);
        }
      } else {
        // Replace variables
        let res = content;
        try {
          const userRow = db.prepare("SELECT name FROM users WHERE uid = ?").get(event.senderID);
          const senderName = userRow ? userRow.name : event.senderID;
          res = res
            .replace(/{sender}/g, senderName)
            .replace(/{uid}/g, event.senderID)
            .replace(/{prefix}/g, config.prefix)
            .replace(/{botname}/g, config.botName)
            .replace(/{args}/g, args.join(" ") || "")
            .replace(/{thread}/g, event.threadID)
            .replace(/{time}/g, new Date().toLocaleTimeString())
            .replace(/{date}/g, new Date().toLocaleDateString());
        } catch {}
        api.sendMessage(res, event.threadID);
      }
    }
  };
}

module.exports.buildCustomCommand = buildCustomCommand;
