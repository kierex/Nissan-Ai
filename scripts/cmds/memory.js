const active = {};

module.exports = {
  config: {
    name: "memory",
    aliases: ["memorygame", "mem"],
    description: "Memory pattern game",
    usage: "memory [amount]",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (active[uid]) {
      const guess = (args[0] || "").toLowerCase().trim();
      const g = active[uid];
      clearTimeout(g.timeout);
      delete active[uid];
      if (guess === g.pattern) {
        const reward = g.bet * g.level;
        db.updateBalance(uid, reward);
        db.addExp(uid, 15 * g.level);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        return api.sendMessage(`✅ CORRECT!\nPattern: ${g.pattern}\n+${config.currency}${reward} (x${g.level} multiplier)\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      } else {
        db.updateBalance(uid, -g.bet);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        return api.sendMessage(`❌ Wrong! Pattern was: ${g.pattern}\n-${config.currency}${g.bet}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
    }

    const amount = parseInt(args[0]) || 100;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max bet 2,000!", event.threadID);

    const emojis = ["🔴", "🟡", "🟢", "🔵", "🟣"];
    const level = Math.floor(Math.random() * 3) + 3; // 3-5 emojis
    const seq = Array.from({ length: level }, () => emojis[Math.floor(Math.random() * emojis.length)]);
    const pattern = seq.join("");

    api.sendMessage(
      `🧠 MEMORY GAME\n━━━━━━━━━━━━━━\nMEMORIZE THIS:\n\n${pattern}\n\n⏰ You have 8 seconds!`,
      event.threadID,
      async () => {
        await new Promise(r => setTimeout(r, 8000));
        if (active[uid]) {
          api.sendMessage(`❓ What was the pattern?\n${level} emojis | Bet: ${config.currency}${amount}\nType ${config.prefix}memory <pattern>\n\n(Copy and paste the emojis!)`, event.threadID);
        }
      }
    );

    active[uid] = {
      pattern, bet: amount, level,
      timeout: setTimeout(() => {
        if (active[uid]) { delete active[uid]; api.sendMessage(`⏰ Time's up! Pattern was: ${pattern}\n-${config.currency}${amount}`, event.threadID); db.updateBalance(uid, -amount); }
      }, 35000)
    };
  }
};
