const active = {};

module.exports = {
  config: {
    name: "snake",
    aliases: ["snakegame"],
    description: "Play Snake — guess the next move",
    usage: "snake [amount]",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (active[uid]) {
      const move = (args[0] || "").toLowerCase();
      const dirs = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️", u: "⬆️", d: "⬇️", l: "⬅️", r: "➡️" };
      if (!dirs[move]) return api.sendMessage("❌ Use: up/down/left/right (u/d/l/r)", event.threadID);

      const g = active[uid];
      clearTimeout(g.timeout);
      g.moves++;

      const correct = move === g.nextMove || move[0] === g.nextMove[0];
      if (correct) {
        g.score++;
        const bonus = g.score * 25;
        db.updateBalance(uid, bonus);
        db.addExp(uid, 5);

        if (g.score >= 5) {
          const totalEarned = g.score * 25 + g.bet;
          db.updateBalance(uid, g.bet);
          db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
          delete active[uid];
          return api.sendMessage(`🐍 SNAKE - YOU WIN!\nScore: ${g.score}/5\n+${config.currency}${totalEarned} total!\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
        }

        const nextMoves = ["up", "down", "left", "right"];
        g.nextMove = nextMoves[Math.floor(Math.random() * nextMoves.length)];
        const grid = generateGrid(g.score);
        g.timeout = setTimeout(() => {
          delete active[uid];
          api.sendMessage("⏰ Too slow! Game over!", event.threadID);
          db.updateBalance(uid, -g.bet);
        }, 15000);
        return api.sendMessage(`✅ Correct! Score: ${g.score}/5\n+${config.currency}${bonus} bonus!\n\n${grid}\n\n➡️ Incoming from: ${dirs[g.nextMove]}\nMove: ${config.prefix}snake <direction> (15s)`, event.threadID);
      } else {
        db.updateBalance(uid, -g.bet);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        delete active[uid];
        return api.sendMessage(`💀 GAME OVER!\nScore: ${g.score}/5\n-${config.currency}${g.bet}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
    }

    const amount = parseInt(args[0]) || 100;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max bet 2,000!", event.threadID);

    const nextMoves = ["up", "down", "left", "right"];
    const nextMove = nextMoves[Math.floor(Math.random() * nextMoves.length)];
    const dirs = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };
    const grid = generateGrid(0);

    active[uid] = {
      score: 0, moves: 0, bet: amount, nextMove,
      timeout: setTimeout(() => {
        delete active[uid];
        api.sendMessage("⏰ Too slow! Snake game ended.", event.threadID);
        db.updateBalance(uid, -amount);
      }, 20000)
    };

    api.sendMessage(
      `🐍 SNAKE GAME\n━━━━━━━━━━━━━━\n${grid}\n\n` +
      `Score 5 moves to win! Each correct move = +${config.currency}25 bonus\n` +
      `Bet: ${config.currency}${amount}\n\n` +
      `🍎 Food incoming from: ${dirs[nextMove]}\n` +
      `Move: ${config.prefix}snake <up/down/left/right>`,
      event.threadID
    );
  }
};

function generateGrid(score) {
  const size = 5;
  const snake = [[2, 2]];
  const food = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)];
  let grid = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (snake.some(([sr, sc]) => sr === r && sc === c)) grid += "🟩";
      else if (food[0] === r && food[1] === c) grid += "🍎";
      else grid += "⬛";
    }
    grid += "\n";
  }
  return grid;
}
