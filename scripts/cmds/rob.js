module.exports = {
  config: {
    name: "rob",
    aliases: ["steal", "heist"],
    description: "Try to rob another user",
    usage: "rob @mention",
    cooldown: 30,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const mentioned = event.mentions && Object.keys(event.mentions);
    if (!mentioned || !mentioned.length) return api.sendMessage(`🦹 Usage: ${config.prefix}rob @user`, event.threadID);

    const targetUID = mentioned[0];
    if (targetUID === uid) return api.sendMessage("❌ You can't rob yourself!", event.threadID);

    const target = db.getUser(targetUID);
    if (!target.registered) return api.sendMessage("❌ Target is not registered!", event.threadID);

    const targetEco = db.getBalance(targetUID);
    const myEco = db.getBalance(uid);

    if (targetEco.balance < 100) return api.sendMessage("💸 Target is too poor to rob!", event.threadID);
    if (myEco.balance < 200) return api.sendMessage("❌ You need at least 200 coins to attempt a rob!", event.threadID);

    const success = Math.random() < 0.45;
    if (success) {
      const stolen = Math.floor(targetEco.balance * (Math.random() * 0.2 + 0.05));
      db.updateBalance(uid, stolen);
      db.updateBalance(targetUID, -stolen);
      db.addExp(uid, 10);
      return api.sendMessage(
        `🦹 ROB SUCCESS!\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🎯 Target: ${target.name}\n` +
        `💰 Stolen: ${config.currency}${stolen.toLocaleString()}\n` +
        `💵 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
        event.threadID
      );
    } else {
      const fine = Math.floor(myEco.balance * 0.1);
      db.updateBalance(uid, -fine);
      return api.sendMessage(
        `🚔 CAUGHT!\n` +
        `━━━━━━━━━━━━━\n` +
        `You were caught robbing ${target.name}!\n` +
        `💸 Fine: ${config.currency}${fine.toLocaleString()}\n` +
        `💵 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
        event.threadID
      );
    }
  }
};
