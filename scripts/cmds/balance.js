module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money", "coins"],
    description: "Check your or someone's balance",
    usage: "balance [@mention]",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.mentions && Object.keys(event.mentions)[0] ? Object.keys(event.mentions)[0] : event.senderID;
    const user = db.getUser(uid);
    const eco = db.getBalance(uid);
    const rank = db.prepare("SELECT COUNT(*) + 1 as rank FROM economy WHERE balance > ?").get(eco.balance);

    if (!user.registered) {
      return api.sendMessage(`❌ ${uid === event.senderID ? "You are" : "This user is"} not registered yet!\nUse ${config.prefix}register <name> to sign up.`, event.threadID);
    }

    api.sendMessage(
      `💰 BALANCE\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 User: ${user.name}\n` +
      `💵 Wallet: ${config.currency}${eco.balance.toLocaleString()}\n` +
      `🏦 Bank: ${config.currency}${(eco.bank || 0).toLocaleString()}\n` +
      `📊 Total: ${config.currency}${(eco.balance + (eco.bank || 0)).toLocaleString()}\n` +
      `🏅 Rank: #${rank.rank}\n` +
      `⭐ Level: ${user.level} | EXP: ${user.exp}`,
      event.threadID
    );
  }
};
