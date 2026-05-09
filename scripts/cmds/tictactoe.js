const games = {};

function makeBoard() { return Array(9).fill(null); }
function display(b) {
  const s = b.map(c => c || "⬜");
  return `${s[0]}${s[1]}${s[2]}\n${s[3]}${s[4]}${s[5]}\n${s[6]}${s[7]}${s[8]}`;
}
function checkWin(b, p) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(([a,c,d]) => b[a] === p && b[c] === p && b[d] === p);
}
function isDraw(b) { return b.every(c => c !== null); }
function botMove(b) {
  const empty = b.map((v,i) => v === null ? i : -1).filter(i => i >= 0);
  const marks = ["❌","⭕"];
  for (const [bot, opp] of [[marks[1],marks[0]],[marks[0],marks[1]]]) {
    for (const i of empty) {
      const test = [...b]; test[i] = bot;
      if (checkWin(test, bot)) return i;
    }
  }
  if (b[4] === null) return 4;
  const corners = [0,2,6,8].filter(i => b[i] === null);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  return empty[Math.floor(Math.random()*empty.length)];
}

module.exports = {
  config: {
    name: "tictactoe",
    aliases: ["ttt", "xo"],
    description: "Play Tic-Tac-Toe against the bot",
    usage: "tictactoe <bet> | tictactoe <1-9>",
    cooldown: 3,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const arg = args[0];
    const pos = parseInt(arg);

    if (games[uid] && pos >= 1 && pos <= 9) {
      const g = games[uid];
      const idx = pos - 1;
      if (g.board[idx]) return api.sendMessage("❌ That spot is taken! Choose another (1-9).", event.threadID);

      g.board[idx] = "❌";
      if (checkWin(g.board, "❌")) {
        db.updateBalance(uid, g.bet);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        db.addExp(uid, 25);
        delete games[uid];
        return api.sendMessage(`🎉 YOU WIN! +${config.currency}${g.bet}\n\n${display(g.board)}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
      if (isDraw(g.board)) {
        delete games[uid];
        return api.sendMessage(`🤝 DRAW! No coins changed.\n\n${display(g.board)}`, event.threadID);
      }

      const bIdx = botMove(g.board);
      g.board[bIdx] = "⭕";

      if (checkWin(g.board, "⭕")) {
        db.updateBalance(uid, -g.bet);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        delete games[uid];
        return api.sendMessage(`😢 BOT WINS! -${config.currency}${g.bet}\n\n${display(g.board)}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
      if (isDraw(g.board)) {
        delete games[uid];
        return api.sendMessage(`🤝 DRAW! No coins changed.\n\n${display(g.board)}`, event.threadID);
      }

      return api.sendMessage(
        `⭕ Bot played position ${bIdx + 1}\n\n${display(g.board)}\n\nYour turn! Type ${config.prefix}ttt <1-9>\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣`,
        event.threadID
      );
    }

    const amount = parseInt(arg) || 0;
    if (games[uid]) return api.sendMessage(`⬜ ACTIVE GAME\n\n${display(games[uid].board)}\n\nType ${config.prefix}ttt <1-9> to play!`, event.threadID);

    const eco = db.getBalance(uid);
    if (amount > 0 && eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 5000) return api.sendMessage("❌ Max bet is 5,000!", event.threadID);

    const board = makeBoard();
    games[uid] = { board, bet: amount };

    api.sendMessage(
      `❌ TIC-TAC-TOE\n` +
      `━━━━━━━━━━━━━━\n` +
      `You: ❌  Bot: ⭕\n` +
      (amount ? `Bet: ${config.currency}${amount}\n` : "") +
      `\n${display(board)}\n\n` +
      `Type ${config.prefix}ttt <1-9> to place:\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣`,
      event.threadID
    );
  }
};
