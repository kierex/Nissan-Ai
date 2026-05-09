module.exports = {
  config: {
    name: "help",
    aliases: ["h", "cmds", "commands"],
    description: "Shows all available commands",
    usage: "help [command]",
    cooldown: 3,
    category: "info"
  },
  run: async ({ api, event, args, commands, config }) => {
    const prefix = config.prefix;

    if (args[0]) {
      const cmd = commands.get(args[0].toLowerCase());
      if (!cmd) return api.sendMessage(`❌ Command "${args[0]}" not found.`, event.threadID);
      return api.sendMessage(
        `📖 COMMAND INFO\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🔹 Name: ${cmd.config.name}\n` +
        `📝 Description: ${cmd.config.description || "No description"}\n` +
        `📌 Usage: ${prefix}${cmd.config.usage || cmd.config.name}\n` +
        `⏱ Cooldown: ${cmd.config.cooldown || 3}s\n` +
        `📂 Category: ${cmd.config.category || "general"}\n` +
        (cmd.config.aliases?.length ? `🔗 Aliases: ${cmd.config.aliases.join(", ")}` : ""),
        event.threadID
      );
    }

    const categories = {};
    const seen = new Set();
    for (const [, cmd] of commands) {
      if (seen.has(cmd.config.name)) continue;
      seen.add(cmd.config.name);
      const cat = cmd.config.category || "general";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    const catIcons = {
      info: "ℹ️",
      economy: "💰",
      games: "🎮",
      fun: "🎉",
      utility: "🔧",
      admin: "👑",
      general: "📦"
    };

    let msg = `╔══════════════════╗\n`;
    msg += `║   🤖 NAV BOT HELP  ║\n`;
    msg += `╚══════════════════╝\n\n`;
    msg += `Prefix: [ ${prefix} ]\n`;
    msg += `Total: ${seen.size} commands\n\n`;

    for (const [cat, cmds] of Object.entries(categories).sort()) {
      const icon = catIcons[cat] || "📦";
      msg += `${icon} ${cat.toUpperCase()}\n`;
      msg += `  ${cmds.sort().map(c => `${prefix}${c}`).join("  ")}\n\n`;
    }

    msg += `💡 Use ${prefix}help [cmd] for details\n`;
    msg += `👑 Admin: fb.com/notfound500`;

    api.sendMessage(msg, event.threadID);
  }
};
