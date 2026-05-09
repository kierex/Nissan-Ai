const active = {};

module.exports = {
  config: {
    name: "numberguess",
    aliases: ["guess", "ng"],
    description: "Guess the number and win coins",
    usage: "numberguess [amount] | numberguess <number>",
    cooldown: 4,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (active[uid]) {
      const guess = parseInt(args[0]);
      if (isNaN(guess)) return api.sendMessage("❌ Enter a valid number!", event.threadID);
      const g = active[uid];
      g.attempts++;
      if (guess === g.number) {
        const bonus = Math.max(0, (10 - g.attempts) * 20);
        const total = g.reward + bonus;
        db.updateBalance(uid, total); db.addExp(uid, 15);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        delete active[uid];
        return api.sendMessage(`🎉 CORRECT! The number was ${g.number}!\nBase: ${config.currency}${g.reward} + Speed Bonus: ${config.currency}${bonus}\n+${config.currency}${total} total!\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
      if (g.attempts >= g.maxAttempts) {
        db.updateBalance(uid, -g.reward);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        delete active[uid];
        return api.sendMessage(`❌ Game over! The number was ${g.number}\n-${config.currency}${g.reward}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
      const hint = guess < g.number ? "📈 Too LOW!" : "📉 Too HIGH!";
      return api.sendMessage(`${hint}\nAttempts: ${g.attempts}/${g.maxAttempts}\nRange: 1-${g.range}`, event.threadID);
    }

    const amount = parseInt(args[0]) || 100;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max bet 2,000!", event.threadID);

    const range = 50;
    const number = Math.floor(Math.random() * range) + 1;
    active[uid] = { number, range, reward: amount, attempts: 0, maxAttempts: 7 };

    api.sendMessage(
      `🔢 NUMBER GUESS\n━━━━━━━━━━━━━━━\nI'm thinking of a number between 1 and ${range}\n💰 Bet: ${config.currency}${amount}\n🎯 Max attempts: 7\n\nType ${config.prefix}guess <number>!`,
      event.threadID
    );
  }
};
