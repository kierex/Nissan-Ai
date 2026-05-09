module.exports = {
  config: {
    name: "flip",
    aliases: ["coinflip", "cf", "heads", "tails"],
    description: "Flip a coin and bet coins",
    usage: "flip <amount> <heads/tails>",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! Use: ${config.prefix}register <name>`, event.threadID);

    const amount = parseInt(args[0]);
    const choice = (args[1] || "").toLowerCase();

    if (!amount || !["heads", "tails", "h", "t"].includes(choice)) {
      return api.sendMessage(
        `🪙 COIN FLIP\n` +
        `Usage: ${config.prefix}flip <amount> <heads/tails>\n` +
        `Example: ${config.prefix}flip 200 heads`,
        event.threadID
      );
    }

    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!\n💰 Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount < 1 || amount > 10000) return api.sendMessage("❌ Bet between 1 and 10,000 coins.", event.threadID);

    const normalChoice = choice === "h" ? "heads" : choice === "t" ? "tails" : choice;
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = normalChoice === result;

    db.updateUser(uid, { games_played: user.games_played + 1 });

    if (won) {
      db.updateBalance(uid, amount);
      db.updateUser(uid, { wins: user.wins + 1 });
      db.addExp(uid, 10);
    } else {
      db.updateBalance(uid, -amount);
      db.updateUser(uid, { losses: user.losses + 1 });
    }

    const newBal = db.getBalance(uid).balance;
    api.sendMessage(
      `🪙 COIN FLIP\n` +
      `━━━━━━━━━━━━━━\n` +
      `Your Pick: ${normalChoice === "heads" ? "🟡 Heads" : "⚪ Tails"}\n` +
      `Result: ${result === "heads" ? "🟡 Heads" : "⚪ Tails"}\n` +
      `━━━━━━━━━━━━━━\n` +
      `${won ? `🎉 YOU WIN! +${config.currency}${amount}` : `😢 YOU LOSE! -${config.currency}${amount}`}\n` +
      `💰 Balance: ${config.currency}${newBal.toLocaleString()}`,
      event.threadID
    );
  }
};
