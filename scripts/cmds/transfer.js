module.exports = {
  config: {
    name: "transfer",
    aliases: ["give", "pay", "send"],
    description: "Transfer coins to another user",
    usage: "transfer @mention <amount>",
    cooldown: 10,
    category: "economy"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const mentioned = event.mentions && Object.keys(event.mentions);
    if (!mentioned || !mentioned.length) return api.sendMessage(`💸 Usage: ${config.prefix}transfer @user <amount>`, event.threadID);

    const targetUID = mentioned[0];
    if (targetUID === uid) return api.sendMessage("❌ You can't transfer to yourself!", event.threadID);

    const target = db.getUser(targetUID);
    if (!target.registered) return api.sendMessage("❌ Target user is not registered!", event.threadID);

    const amount = parseInt(args[args.length - 1]);
    if (!amount || amount < 1) return api.sendMessage("❌ Enter a valid amount!", event.threadID);

    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 100000) return api.sendMessage("❌ Max transfer is 100,000 coins!", event.threadID);

    const fee = Math.floor(amount * 0.02);
    const netAmount = amount - fee;
    db.updateBalance(uid, -amount);
    db.updateBalance(targetUID, netAmount);

    api.sendMessage(
      `💸 TRANSFER SUCCESS!\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `From: ${user.name}\n` +
      `To: ${target.name}\n` +
      `Amount: ${config.currency}${netAmount.toLocaleString()}\n` +
      `Fee (2%): ${config.currency}${fee}\n` +
      `Your Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
      event.threadID
    );
  }
};
