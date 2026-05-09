"use strict";
module.exports = {
  config: {
    name: "removecmd",
    aliases: ["delcmd", "deletecmd", "rmcmd"],
    description: "Remove a custom command permanently from the database",
    usage: "removecmd <name>",
    cooldown: 3,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db, config, commands }) => {
    if (!args[0]) {
      // List all custom commands
      try {
        const all = db.prepare("SELECT name, type, use_count, added_at FROM custom_commands ORDER BY added_at DESC").all();
        if (!all.length) return api.sendMessage(`📋 No custom commands yet.\nAdd one: ${config.prefix}addcmd <name> | <response>`, event.threadID);

        let msg = `📋 CUSTOM COMMANDS (${all.length})\n${"─".repeat(28)}\n`;
        all.forEach((c, i) => {
          msg += `${i + 1}. ${config.prefix}${c.name} [${c.type}] — used ${c.use_count}x\n`;
        });
        msg += `\nRemove: ${config.prefix}removecmd <name>`;
        return api.sendMessage(msg, event.threadID);
      } catch (e) {
        return api.sendMessage(`❌ Error: ${e.message}`, event.threadID);
      }
    }

    const name = args[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");

    // Check if it's a custom command
    try {
      const row = db.prepare("SELECT * FROM custom_commands WHERE name = ?").get(name);
      if (!row) {
        return api.sendMessage(`❌ Custom command "${name}" not found.\nUse ${config.prefix}removecmd to list all custom commands.`, event.threadID);
      }

      db.prepare("DELETE FROM custom_commands WHERE name = ?").run(name);
      commands.delete(name);

      api.sendMessage(
        `🗑️ COMMAND REMOVED!\n${"─".repeat(26)}\n` +
        `📌 Name: ${config.prefix}${name}\n` +
        `📂 Type: ${row.type}\n` +
        `📊 Was used: ${row.use_count} time${row.use_count !== 1 ? "s" : ""}\n` +
        `✅ Deleted from database permanently\n` +
        `🔄 Removed from bot immediately`,
        event.threadID
      );
    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, event.threadID);
    }
  }
};
