"use strict";

module.exports = {
  config: {
    name: "help",
    aliases: ["h", "cmds", "menu"],
    description: "Show all commands or info about a specific command",
    usage: "help [command]",
    cooldown: 3,
    category: "info"
  },

  run: async ({ api, event, args, commands, config }) => {
    const prefix = config.prefix;
    const { threadID } = event;

    if (args[0]) {
      const name = args[0].toLowerCase();
      const cmd = commands.get(name);
      if (!cmd) {
        return api.sendMessage(
          `❌ Command "${args[0]}" not found.\n💡 Use ${prefix}help to see all commands.`,
          threadID
        );
      }
      const c = cmd.config;
      const lines = [
        `╔══════════════════════╗`,
        `║   📖 COMMAND INFO    ║`,
        `╚══════════════════════╝`,
        ``,
        `🔹 Name     : ${c.name}`,
        `📝 Desc     : ${c.description || "No description"}`,
        `📌 Usage    : ${prefix}${c.usage || c.name}`,
        `📂 Category : ${c.category || "general"}`,
        `⏱ Cooldown : ${c.cooldown || 3}s`,
      ];
      if (c.aliases && c.aliases.length) lines.push(`🔗 Aliases  : ${c.aliases.map(a => prefix + a).join(", ")}`);
      if (c.adminOnly) lines.push(`👑 Admin only`);
      return api.sendMessage(lines.join("\n"), threadID);
    }

    const catMap = {};
    const seen   = new Set();
    for (const [, cmd] of commands) {
      if (seen.has(cmd.config.name)) continue;
      seen.add(cmd.config.name);
      const cat = (cmd.config.category || "general").toLowerCase();
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(cmd.config.name);
    }

    const catIcon = {
      info: "ℹ️", economy: "💰", games: "🎮", fun: "🎉",
      utility: "🛠", admin: "👑", general: "📦", social: "👥"
    };

    let msg = "";
    msg += `╔═══════════════════════════╗\n`;
    msg += `║      🤖  NAV BOT MENU      ║\n`;
    msg += `╚═══════════════════════════╝\n\n`;
    msg += `  Prefix  : [ ${prefix} ]\n`;
    msg += `  Commands: ${seen.size} total\n`;
    msg += `  Uptime  : ${formatUptime(global.startTime)}\n\n`;
    msg += `${"─".repeat(30)}\n`;

    for (const cat of Object.keys(catMap).sort()) {
      const icon = catIcon[cat] || "📦";
      const list = catMap[cat].sort();
      msg += `\n${icon} ${cat.toUpperCase()} (${list.length})\n`;
      for (let i = 0; i < list.length; i += 3) {
        msg += `  ${list.slice(i, i + 3).map(n => `${prefix}${n}`).join("  ")}\n`;
      }
    }

    msg += `\n${"─".repeat(30)}\n`;
    msg += `💡 ${prefix}help [cmd] for details\n`;
    msg += `🔧 NAV BOT v${config.version || "1.0"}`;
    api.sendMessage(msg, threadID);
  }
};

function formatUptime(startTime) {
  const s = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
