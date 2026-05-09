module.exports = {
  config: {
    name: "dice",
    aliases: ["roll", "bet"],
    description: "Roll dice and bet coins",
    usage: "dice <amount> [sides]",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! Use: ${config.prefix}register <name>`, event.threadID);

    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return api.sendMessage(`🎲 Usage: ${config.prefix}dice <amount>\nExample: ${config.prefix}dice 100`, event.threadID);

    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!\n💰 Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 10000) return api.sendMessage("❌ Max bet is 10,000 coins!", event.threadID);

    const sides = parseInt(args[1]) || 6;
    const playerRoll = Math.floor(Math.random() * sides) + 1;
    const botRoll = Math.floor(Math.random() * sides) + 1;

    db.updateUser(uid, { games_played: user.games_played + 1 });

    let result, winAmount;
    if (playerRoll > botRoll) {
      winAmount = amount;
      db.updateBalance(uid, winAmount);
      db.updateUser(uid, { wins: user.wins + 1 });
      db.addExp(uid, 15);
      result = `🎉 YOU WIN! +${config.currency}${winAmount}`;
    } else if (botRoll > playerRoll) {
      winAmount = -amount;
      db.updateBalance(uid, winAmount);
      db.updateUser(uid, { losses: user.losses + 1 });
      result = `😢 YOU LOSE! -${config.currency}${amount}`;
    } else {
      winAmount = 0;
      result = `🤝 TIE! No change`;
    }

    const newBal = db.getBalance(uid).balance;
    api.sendMessage(
      `🎲 DICE ROLL (${sides}-sided)\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎯 Your Roll: ${playerRoll}\n` +
      `🤖 Bot Roll: ${botRoll}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `${result}\n` +
      `💰 Balance: ${config.currency}${newBal.toLocaleString()}`,
      event.threadID
    );
  }
};
