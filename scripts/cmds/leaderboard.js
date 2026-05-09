module.exports = {
  config: {
    name: "leaderboard",
    aliases: ["lb", "top", "rank"],
    description: "View top players leaderboard",
    usage: "leaderboard [balance/exp/wins]",
    cooldown: 5,
    category: "info"
  },
  run: async ({ api, event, args, db, config }) => {
    const type = (args[0] || "balance").toLowerCase();
    const validTypes = ["balance", "exp", "wins"];
    if (!validTypes.includes(type)) {
      return api.sendMessage(`❌ Valid types: balance, exp, wins\nUsage: ${config.prefix}lb [balance/exp/wins]`, event.threadID);
    }

    const data = db.getLeaderboard(type, 10);
    if (!data.length) return api.sendMessage("📊 No data yet!", event.threadID);

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const icons = { balance: "💰", exp: "⭐", wins: "🏆" };
    const labels = { balance: "coins", exp: "EXP", wins: "wins" };

    let msg = `${icons[type]} TOP 10 — ${type.toUpperCase()}\n${"━".repeat(24)}\n`;
    data.forEach((u, i) => {
      const val = type === "balance" ? u.balance : type === "exp" ? u.exp : u.wins;
      msg += `${medals[i]} ${u.name || "Unknown"}: ${val?.toLocaleString() || 0} ${labels[type]}\n`;
    });
    msg += `\nUse ${config.prefix}lb [balance/exp/wins]`;

    api.sendMessage(msg, event.threadID);
  }
};
