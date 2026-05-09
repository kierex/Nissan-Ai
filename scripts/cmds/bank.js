module.exports = {
  config: {
    name: "bank",
    aliases: ["deposit", "withdraw"],
    description: "Manage your bank account",
    usage: "bank deposit/withdraw <amount>",
    cooldown: 5,
    category: "economy"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const action = (args[0] || "").toLowerCase();
    const amount = parseInt(args[1]);
    const eco = db.getBalance(uid);

    if (!action || !["deposit", "dep", "withdraw", "wd", "balance", "bal"].includes(action)) {
      return api.sendMessage(
        `🏦 BANK\n━━━━━━━━━━━━━━\n💵 Wallet: ${config.currency}${eco.balance.toLocaleString()}\n🏦 Bank: ${config.currency}${(eco.bank || 0).toLocaleString()}\n\nCommands:\n${config.prefix}bank deposit <amount>\n${config.prefix}bank withdraw <amount>`,
        event.threadID
      );
    }

    if (["deposit", "dep"].includes(action)) {
      if (!amount || amount < 1) return api.sendMessage("❌ Enter valid amount!", event.threadID);
      if (eco.balance < amount) return api.sendMessage(`❌ Not enough in wallet! Wallet: ${config.currency}${eco.balance}`, event.threadID);
      db.db.prepare("UPDATE economy SET balance = balance - ?, bank = bank + ? WHERE uid = ?").run(amount, amount, uid);
      const updated = db.getBalance(uid);
      return api.sendMessage(`✅ Deposited ${config.currency}${amount}\n💵 Wallet: ${config.currency}${updated.balance.toLocaleString()}\n🏦 Bank: ${config.currency}${updated.bank.toLocaleString()}`, event.threadID);
    }

    if (["withdraw", "wd"].includes(action)) {
      if (!amount || amount < 1) return api.sendMessage("❌ Enter valid amount!", event.threadID);
      if ((eco.bank || 0) < amount) return api.sendMessage(`❌ Not enough in bank! Bank: ${config.currency}${eco.bank || 0}`, event.threadID);
      db.db.prepare("UPDATE economy SET balance = balance + ?, bank = bank - ? WHERE uid = ?").run(amount, amount, uid);
      const updated = db.getBalance(uid);
      return api.sendMessage(`✅ Withdrew ${config.currency}${amount}\n💵 Wallet: ${config.currency}${updated.balance.toLocaleString()}\n🏦 Bank: ${config.currency}${updated.bank.toLocaleString()}`, event.threadID);
    }
  }
};
