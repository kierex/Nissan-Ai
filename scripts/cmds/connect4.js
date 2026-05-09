const games = {};

function makeBoard() { return Array(6).fill(null).map(() => Array(7).fill(0)); }
function boardStr(b) {
  const nums = "1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";
  let s = "";
  for (const row of b) s += row.map(c => c === 1 ? "🔴" : c === 2 ? "🟡" : "⬜").join("") + "\n";
  return s + nums;
}
function dropPiece(b, col, player) {
  for (let r = 5; r >= 0; r--) { if (b[r][col] === 0) { b[r][col] = player; return r; } }
  return -1;
}
function checkWin(b, r, c, p) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let d = 1; d < 4; d++) { const nr = r+dr*d, nc = c+dc*d; if (nr>=0&&nr<6&&nc>=0&&nc<7&&b[nr][nc]===p) count++; else break; }
    for (let d = 1; d < 4; d++) { const nr = r-dr*d, nc = c-dc*d; if (nr>=0&&nr<6&&nc>=0&&nc<7&&b[nr][nc]===p) count++; else break; }
    if (count >= 4) return true;
  }
  return false;
}
function botMove(b) {
  for (let p of [2,1]) {
    for (let c = 0; c < 7; c++) {
      const test = b.map(r => [...r]);
      const r = dropPiece(test, c, p);
      if (r >= 0 && checkWin(test, r, c, p)) return c;
    }
  }
  const cols = [3,2,4,1,5,0,6].filter(c => b[0][c] === 0);
  return cols[Math.floor(Math.random() * cols.length)] ?? -1;
}

module.exports = {
  config: {
    name: "connect4",
    aliases: ["c4", "connect"],
    description: "Play Connect 4 vs the bot",
    usage: "connect4 [bet] | connect4 <col 1-7>",
    cooldown: 3,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const col = parseInt(args[0]) - 1;
    if (games[uid] && !isNaN(col) && col >= 0 && col <= 6) {
      const g = games[uid];
      const r = dropPiece(g.board, col, 1);
      if (r < 0) return api.sendMessage("❌ Column full! Choose another.", event.threadID);

      if (checkWin(g.board, r, col, 1)) {
        db.updateBalance(uid, g.bet); db.addExp(uid, 30);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        delete games[uid];
        return api.sendMessage(`${boardStr(g.board)}\n🎉 YOU WIN! +${config.currency}${g.bet}\n💰 ${db.getBalance(uid).balance}`, event.threadID);
      }

      const bc = botMove(g.board);
      if (bc < 0) { delete games[uid]; return api.sendMessage(`${boardStr(g.board)}\n🤝 DRAW!`, event.threadID); }
      const br = dropPiece(g.board, bc, 2);

      if (checkWin(g.board, br, bc, 2)) {
        db.updateBalance(uid, -g.bet);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        delete games[uid];
        return api.sendMessage(`${boardStr(g.board)}\n😢 Bot wins! -${config.currency}${g.bet}\n💰 ${db.getBalance(uid).balance}`, event.threadID);
      }

      return api.sendMessage(`${boardStr(g.board)}\n🔴 You | 🟡 Bot\nYour turn! ${config.prefix}c4 <1-7>`, event.threadID);
    }

    if (games[uid]) return api.sendMessage(`🎮 Active game!\n${boardStr(games[uid].board)}\nType ${config.prefix}c4 <1-7>`, event.threadID);

    const amount = parseInt(args[0]) || 0;
    const eco = db.getBalance(uid);
    if (amount > 0 && eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 5000) return api.sendMessage("❌ Max bet 5,000!", event.threadID);

    games[uid] = { board: makeBoard(), bet: amount };
    api.sendMessage(`🔴 CONNECT 4\n━━━━━━━━━━━━━\nYou: 🔴 | Bot: 🟡\n${amount ? `Bet: ${config.currency}${amount}\n` : ""}\n${boardStr(games[uid].board)}\n\nType ${config.prefix}c4 <1-7>`, event.threadID);
  }
};
