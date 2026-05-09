module.exports = {
  config: {
    name: "addcoins",
    aliases: ["addbal", "give"],
    description: "Add coins to a user",
    usage: "addcoins @mention <amount>",
    cooldown: 3,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db, config }) => {
    const mentioned = event.mentions && Object.keys(event.mentions);
    if (!mentioned || !mentioned.length) return api.sendMessage(`💰 Usage: ${config.prefix}addcoins @user <amount>`, event.threadID);
    const targetUID = mentioned[0];
    const amount = parseInt(args[args.length - 1]);
    if (!amount) return api.sendMessage("❌ Enter a valid amount!", event.threadID);
    db.updateBalance(targetUID, amount);
    api.sendMessage(`✅ Added ${config.currency}${amount} to user ${targetUID}\nNew balance: ${config.currency}${db.getBalance(targetUID).balance.toLocaleString()}`, event.threadID);
  }
};
