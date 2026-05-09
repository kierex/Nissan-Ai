module.exports = {
  config: {
    name: "slots",
    aliases: ["slot", "spin"],
    description: "Spin the slot machine",
    usage: "slots <amount>",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return api.sendMessage(`🎰 Usage: ${config.prefix}slots <amount>\nExample: ${config.prefix}slots 100`, event.threadID);

    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 5000) return api.sendMessage("❌ Max bet is 5,000!", event.threadID);

    const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣", "🎰"];
    const weights =  [30,    25,    20,    15,    5,    3,    1,    1];
    const total = weights.reduce((a, b) => a + b, 0);

    function spin() {
      let r = Math.random() * total;
      for (let i = 0; i < symbols.length; i++) {
        r -= weights[i];
        if (r <= 0) return symbols[i];
      }
      return symbols[0];
    }

    const reels = [spin(), spin(), spin()];
    db.updateUser(uid, { games_played: user.games_played + 1 });

    let mult = 0, msg = "";
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const jackpotMults = { "7️⃣": 10, "💎": 8, "⭐": 5, "🎰": 7, "🍇": 3, "🍊": 2.5, "🍋": 2, "🍒": 1.5 };
      mult = jackpotMults[reels[0]] || 2;
      if (reels[0] === "7️⃣") msg = "🎊 JACKPOT! TRIPLE 7s!!! 🎊";
      else if (reels[0] === "💎") msg = "💎 DIAMOND JACKPOT!";
      else msg = `🎉 TRIPLE ${reels[0]}! BIG WIN!`;
      db.updateUser(uid, { wins: user.wins + 1 });
      db.addExp(uid, 30);
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      mult = 0.5;
      msg = "🎯 Two of a kind! Small win!";
    } else {
      msg = "😢 No match! Better luck next time!";
      db.updateUser(uid, { losses: user.losses + 1 });
    }

    const winAmount = mult > 0 ? Math.floor(amount * mult) : 0;
    const net = winAmount - amount;
    if (net > 0) db.updateBalance(uid, net);
    else if (net < 0) db.updateBalance(uid, net);

    const newBal = db.getBalance(uid).balance;
    api.sendMessage(
      `🎰 SLOT MACHINE\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `[ ${reels.join(" | ")} ]\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `${msg}\n` +
      `${net >= 0 ? `✨ Won: ${config.currency}${winAmount} (x${mult})` : `💸 Lost: ${config.currency}${amount}`}\n` +
      `💰 Balance: ${config.currency}${newBal.toLocaleString()}`,
      event.threadID
    );
  }
};
