module.exports = {
  config: {
    name: "uptime",
    aliases: ["ut", "runtime"],
    description: "Check bot uptime and stats",
    usage: "uptime",
    cooldown: 5,
    category: "info"
  },
  run: async ({ api, event, db, config }) => {
    const startStat = db.getStat("start_time");
    const start = startStat ? new Date(startStat) : new Date(global.startTime || Date.now());
    const now = new Date();
    const ms = now - start;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const uptime = d > 0 ? `${d}d ${h%24}h ${m%60}m` : h > 0 ? `${h}h ${m%60}m ${s%60}s` : `${m}m ${s%60}s`;

    const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() || {}).c || 0;
    const regUsers   = (db.prepare("SELECT COUNT(*) as c FROM users WHERE registered = 1").get() || {}).c || 0;
    const totalCmds  = db.getStat("total_commands") || "0";
    const mem        = process.memoryUsage();
    const memMB      = (mem.heapUsed / 1024 / 1024).toFixed(1);

    api.sendMessage(
      `🤖 NAV BOT STATUS\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `⏱ Uptime  : ${uptime}\n` +
      `📅 Started : ${start.toLocaleString()}\n` +
      `👥 Users   : ${totalUsers} (${regUsers} registered)\n` +
      `⚡ Cmds Run: ${parseInt(totalCmds).toLocaleString()}\n` +
      `💾 Memory  : ${memMB} MB\n` +
      `🔧 Node    : ${process.version}\n` +
      `📦 Version : v${config.version}\n` +
      `🌐 Prefix  : ${config.prefix}`,
      event.threadID
    );
  }
};
