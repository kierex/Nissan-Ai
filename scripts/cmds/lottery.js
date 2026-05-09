module.exports = {
  config: {
    name: "lottery",
    aliases: ["lotto", "jackpot"],
    description: "Try your luck at the lottery",
    usage: "lottery <tickets>",
    cooldown: 10,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const tickets = Math.min(parseInt(args[0]) || 1, 10);
    const cost = tickets * 100;
    const eco = db.getBalance(uid);
    if (eco.balance < cost) return api.sendMessage(`❌ Need ${config.currency}${cost} for ${tickets} ticket(s). Balance: ${config.currency}${eco.balance}`, event.threadID);

    db.updateBalance(uid, -cost);
    db.updateUser(uid, { games_played: user.games_played + 1 });

    let totalWon = 0;
    const results = [];
    for (let i = 0; i < tickets; i++) {
      const nums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1);
      const winning = Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1);
      const matches = nums.filter((n, idx) => n === winning[idx]).length;
      let prize = 0;
      if (matches === 5) prize = 10000;
      else if (matches === 4) prize = 2000;
      else if (matches === 3) prize = 500;
      else if (matches === 2) prize = 150;
      else if (matches === 1) prize = 50;
      totalWon += prize;
      results.push({ nums: nums.join("-"), winning: winning.join("-"), matches, prize });
    }

    if (totalWon > 0) {
      db.updateBalance(uid, totalWon);
      db.updateUser(uid, { wins: user.wins + 1 });
    } else {
      db.updateUser(uid, { losses: user.losses + 1 });
    }

    const net = totalWon - cost;
    let msg = `🎟️ LOTTERY RESULTS\n${"━".repeat(24)}\n`;
    results.forEach((r, i) => {
      msg += `Ticket ${i + 1}: ${r.nums}\nWinning:  ${r.winning}\nMatches: ${r.matches} | Prize: ${config.currency}${r.prize}\n\n`;
    });
    msg += `${"━".repeat(24)}\n💸 Spent: ${config.currency}${cost}\n`;
    msg += `💰 Won: ${config.currency}${totalWon}\n`;
    msg += `${net >= 0 ? `✨ Net: +${config.currency}${net}` : `📉 Net: -${config.currency}Math.abs(net)`}\n`;
    msg += `💵 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`;
    api.sendMessage(msg, event.threadID);
  }
};
