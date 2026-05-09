module.exports = {
  config: {
    name: "highlow",
    aliases: ["hl", "hilo"],
    description: "Guess Higher or Lower card game",
    usage: "highlow <amount> <high/low>",
    cooldown: 4,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const amount = parseInt(args[0]);
    const choice = (args[1] || "").toLowerCase();

    if (!amount || !["high", "low", "h", "l"].includes(choice)) {
      return api.sendMessage(
        `🃏 HIGH-LOW\n━━━━━━━━━━━━━\nA card is shown. Guess if next card is higher or lower!\n` +
        `Usage: ${config.prefix}hl <amount> <high/low>\nExample: ${config.prefix}hl 200 high`,
        event.threadID
      );
    }

    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount < 1 || amount > 5000) return api.sendMessage("❌ Bet between 1 and 5,000!", event.threadID);

    const suits = ["♠", "♥", "♦", "♣"];
    const faces = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const vals = { A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13 };

    const card1 = faces[Math.floor(Math.random() * faces.length)];
    const card2 = faces[Math.floor(Math.random() * faces.length)];
    const s1 = suits[Math.floor(Math.random() * suits.length)];
    const s2 = suits[Math.floor(Math.random() * suits.length)];

    const isHigh = choice === "high" || choice === "h";
    let won = false;
    if (vals[card2] === vals[card1]) {
      won = false;
    } else if (isHigh && vals[card2] > vals[card1]) {
      won = true;
    } else if (!isHigh && vals[card2] < vals[card1]) {
      won = true;
    }

    db.updateUser(uid, { games_played: user.games_played + 1 });
    if (won) {
      db.updateBalance(uid, amount);
      db.updateUser(uid, { wins: user.wins + 1 });
      db.addExp(uid, 12);
    } else {
      db.updateBalance(uid, -amount);
      db.updateUser(uid, { losses: user.losses + 1 });
    }

    api.sendMessage(
      `🃏 HIGH-LOW\n━━━━━━━━━━━━━━━\n` +
      `Card 1: ${card1}${s1} (${vals[card1]})\n` +
      `Card 2: ${card2}${s2} (${vals[card2]})\n` +
      `Your guess: ${isHigh ? "Higher" : "Lower"}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${won ? `🎉 CORRECT! +${config.currency}${amount}` : `❌ WRONG! -${config.currency}${amount}`}\n` +
      `💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
      event.threadID
    );
  }
};
