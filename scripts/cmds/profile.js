module.exports = {
  config: {
    name: "profile",
    aliases: ["me", "stats", "pro"],
    description: "View your profile stats",
    usage: "profile [@mention]",
    cooldown: 3,
    category: "info"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.mentions && Object.keys(event.mentions)[0] ? Object.keys(event.mentions)[0] : event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ User not registered!\nUse: ${config.prefix}register <name>`, event.threadID);
    const eco = db.getBalance(uid);
    const expNeeded = Math.pow(user.level, 2) * 100;
    const progressPct = Math.min(100, Math.floor((user.exp % expNeeded) / expNeeded * 10));
    const bar = "█".repeat(progressPct) + "░".repeat(10 - progressPct);
    const rank = db.prepare("SELECT COUNT(*) + 1 as rank FROM economy WHERE balance > ?").get(eco.balance);
    const winRate = user.games_played > 0 ? ((user.wins / user.games_played) * 100).toFixed(1) : "0.0";

    api.sendMessage(
      `👤 PROFILE: ${user.name}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 UID: ${uid}\n` +
      `⭐ Level: ${user.level} | EXP: ${user.exp}\n` +
      `📊 Progress: [${bar}] ${progressPct * 10}%\n` +
      `💰 Balance: ${config.currency}${eco.balance.toLocaleString()}\n` +
      `🏅 Rank: #${rank.rank}\n` +
      `🎮 Games: ${user.games_played} played\n` +
      `🏆 Wins: ${user.wins} | Losses: ${user.losses}\n` +
      `📈 Win Rate: ${winRate}%\n` +
      `🔥 Daily Streak: ${user.daily_streak} days\n` +
      `📅 Joined: ${new Date(user.joined_at).toLocaleDateString()}`,
      event.threadID
    );
  }
};
