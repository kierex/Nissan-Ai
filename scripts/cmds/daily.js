module.exports = {
  config: {
    name: "daily",
    aliases: ["claim", "reward"],
    description: "Claim your daily coins reward",
    usage: "daily",
    cooldown: 5,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Please register first!\nUse: ${config.prefix}register <name>`, event.threadID);

    const now = new Date();
    const lastDaily = user.last_daily ? new Date(user.last_daily) : null;
    const today = now.toDateString();

    if (lastDaily && lastDaily.toDateString() === today) {
      const nextReset = new Date(now);
      nextReset.setDate(nextReset.getDate() + 1);
      nextReset.setHours(0, 0, 0, 0);
      const msLeft = nextReset - now;
      const h = Math.floor(msLeft / 3600000);
      const m = Math.floor((msLeft % 3600000) / 60000);
      return api.sendMessage(
        `⏰ Already claimed today!\n⏳ Next claim in: ${h}h ${m}m\n💡 Come back tomorrow!`,
        event.threadID
      );
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isStreak = lastDaily && lastDaily.toDateString() === yesterday.toDateString();
    const streak = isStreak ? user.daily_streak + 1 : 1;
    const bonus = Math.min(streak * 50, 500);
    const amount = (config.dailyAmount || 200) + bonus;

    db.updateBalance(uid, amount);
    db.updateUser(uid, {
      last_daily: now.toISOString(),
      daily_streak: streak
    });
    db.addExp(uid, 20);

    const eco = db.getBalance(uid);
    api.sendMessage(
      `🎁 DAILY REWARD CLAIMED!\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Base: ${config.currency}${config.dailyAmount || 200}\n` +
      `🔥 Streak Bonus (${streak} days): +${config.currency}${bonus}\n` +
      `✨ Total Earned: ${config.currency}${amount}\n` +
      `💵 New Balance: ${config.currency}${eco.balance.toLocaleString()}\n` +
      `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}\n\n` +
      `${streak >= 7 ? "🏆 Week streak! Amazing!" : streak >= 3 ? "⚡ Keep it up!" : "💡 Claim daily for bonuses!"}`,
      event.threadID
    );
  }
};
