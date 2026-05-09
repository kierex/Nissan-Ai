const activeGames = {};

module.exports = {
  config: {
    name: "math",
    aliases: ["calculate", "calc"],
    description: "Solve math problems to earn coins",
    usage: "math <amount>",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (activeGames[uid]) {
      const answer = parseFloat(args.join(""));
      const game = activeGames[uid];
      clearTimeout(game.timeout);
      delete activeGames[uid];

      if (Math.abs(answer - game.answer) < 0.01) {
        db.updateBalance(uid, game.reward);
        db.addExp(uid, 10);
        return api.sendMessage(
          `✅ CORRECT!\n` +
          `Answer: ${game.answer}\n` +
          `+${config.currency}${game.reward} earned!\n` +
          `💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
          event.threadID
        );
      } else {
        db.updateBalance(uid, -game.reward);
        return api.sendMessage(
          `❌ WRONG!\n` +
          `Your answer: ${answer}\n` +
          `Correct: ${game.answer}\n` +
          `-${config.currency}${game.reward} lost.\n` +
          `💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
          event.threadID
        );
      }
    }

    const amount = parseInt(args[0]) || 100;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max bet is 2,000!", event.threadID);

    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    if (op === "+") { a = Math.floor(Math.random()*100)+1; b = Math.floor(Math.random()*100)+1; answer = a+b; }
    else if (op === "-") { a = Math.floor(Math.random()*100)+1; b = Math.floor(Math.random()*a)+1; answer = a-b; }
    else { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; answer = a*b; }

    activeGames[uid] = {
      answer,
      reward: amount,
      timeout: setTimeout(() => {
        if (activeGames[uid]) {
          delete activeGames[uid];
          api.sendMessage(`⏰ Time's up! Answer was: ${answer}\n-${config.currency}${amount}`, event.threadID);
          db.updateBalance(uid, -amount);
        }
      }, 20000)
    };

    api.sendMessage(
      `🧮 MATH CHALLENGE\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `❓ ${a} ${op} ${b} = ?\n\n` +
      `💰 Bet: ${config.currency}${amount}\n` +
      `⏰ Time: 20 seconds\n\n` +
      `Type ${config.prefix}math <answer>`,
      event.threadID
    );
  }
};
