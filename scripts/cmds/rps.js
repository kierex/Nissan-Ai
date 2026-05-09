module.exports = {
  config: {
    name: "rps",
    aliases: ["rockpaperscissors"],
    description: "Play Rock Paper Scissors",
    usage: "rps <rock/paper/scissors> <amount>",
    cooldown: 4,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const choices = { rock: "🪨", paper: "📄", scissors: "✂️" };
    const beats = { rock: "scissors", scissors: "paper", paper: "rock" };
    const choice = (args[0] || "").toLowerCase();
    const amount = parseInt(args[1]) || 0;

    if (!choices[choice]) return api.sendMessage(`✂️ RPS\nUsage: ${config.prefix}rps <rock/paper/scissors> [amount]\nExample: ${config.prefix}rps rock 100`, event.threadID);

    const eco = db.getBalance(uid);
    if (amount > 0 && eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 5000) return api.sendMessage("❌ Max bet is 5,000!", event.threadID);

    const options = Object.keys(choices);
    const botChoice = options[Math.floor(Math.random() * options.length)];
    db.updateUser(uid, { games_played: user.games_played + 1 });

    let result;
    if (choice === botChoice) {
      result = "tie";
    } else if (beats[choice] === botChoice) {
      result = "win";
      if (amount > 0) db.updateBalance(uid, amount);
      db.updateUser(uid, { wins: user.wins + 1 });
      db.addExp(uid, 10);
    } else {
      result = "lose";
      if (amount > 0) db.updateBalance(uid, -amount);
      db.updateUser(uid, { losses: user.losses + 1 });
    }

    const msgs = {
      win: `🎉 YOU WIN!${amount ? ` +${config.currency}${amount}` : ""}`,
      lose: `😢 YOU LOSE!${amount ? ` -${config.currency}${amount}` : ""}`,
      tie: `🤝 TIE! No change`
    };

    api.sendMessage(
      `✂️ ROCK PAPER SCISSORS\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `You: ${choices[choice]} ${choice}\n` +
      `Bot: ${choices[botChoice]} ${botChoice}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${msgs[result]}\n` +
      (amount ? `💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}` : ""),
      event.threadID
    );
  }
};
