module.exports = {
  config: {
    name: "streak",
    aliases: ["dailystreak", "mystreak"],
    description: "Check your daily streak and top streamers",
    usage: "streak",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const topStreaks = db.prepare(`
      SELECT name, daily_streak FROM users 
      WHERE registered = 1 AND banned = 0 
      ORDER BY daily_streak DESC LIMIT 5
    `).all();

    const mult = Math.min(1 + (user.daily_streak * 0.1), 3).toFixed(1);
    const nextBonus = Math.min(user.daily_streak * 50, 500);
    const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];

    let msg = `🔥 STREAK INFO: ${user.name}\n${"━".repeat(24)}\n`;
    msg += `🔥 Current Streak: ${user.daily_streak} day${user.daily_streak !== 1 ? "s" : ""}\n`;
    msg += `💰 Daily Bonus: +${config.currency}${nextBonus}\n`;
    msg += `⚡ Multiplier: x${mult}\n`;
    msg += `📅 Last Claim: ${user.last_daily ? new Date(user.last_daily).toLocaleDateString() : "Never"}\n\n`;
    msg += `🏆 TOP STREAKS\n${"─".repeat(20)}\n`;
    topStreaks.forEach((u, i) => {
      msg += `${medals[i]} ${u.name}: 🔥${u.daily_streak} days\n`;
    });
    msg += `\n💡 Claim daily with ${config.prefix}daily`;
    api.sendMessage(msg, event.threadID);
  }
};
