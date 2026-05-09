const riddles = [
  { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "map", hint: "You look at me for directions" },
  { q: "The more you take, the more you leave behind. What am I?", a: "footsteps", hint: "You make them when you walk" },
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "echo", hint: "Caves produce me" },
  { q: "What has hands but can't clap?", a: "clock", hint: "It tells time" },
  { q: "I'm light as a feather, but even the strongest person can't hold me for 5 minutes. What am I?", a: "breath", hint: "You need it to live" },
  { q: "What gets wetter the more it dries?", a: "towel", hint: "Use it after a shower" },
  { q: "I have a tail and a head, but no body. What am I?", a: "coin", hint: "Used as money" },
  { q: "The more there is, the less you see. What am I?", a: "darkness", hint: "Opposite of light" },
  { q: "What can travel around the world while staying in a corner?", a: "stamp", hint: "Put it on an envelope" },
  { q: "What goes up but never comes down?", a: "age", hint: "Happens every birthday" }
];
const active = {};

module.exports = {
  config: {
    name: "riddle",
    aliases: ["brain", "puzzle"],
    description: "Solve a riddle to win coins",
    usage: "riddle [amount]",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (active[uid]) {
      const guess = args.join(" ").toLowerCase().trim();
      const g = active[uid];
      clearTimeout(g.timeout);
      delete active[uid];
      if (guess === g.answer) {
        db.updateBalance(uid, g.reward);
        db.addExp(uid, 20);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        return api.sendMessage(`🧠 CORRECT! "${g.answer}"\n+${config.currency}${g.reward}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      } else {
        db.updateBalance(uid, -g.reward);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        return api.sendMessage(`❌ Wrong! Answer: "${g.answer}"\n-${config.currency}${g.reward}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
    }

    const amount = parseInt(args[0]) || 150;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 3000) return api.sendMessage("❌ Max bet 3,000!", event.threadID);

    const r = riddles[Math.floor(Math.random() * riddles.length)];
    active[uid] = {
      answer: r.a, reward: amount,
      timeout: setTimeout(() => {
        if (active[uid]) { delete active[uid]; api.sendMessage(`⏰ Time's up! Answer: "${r.a}"\n-${config.currency}${amount}`, event.threadID); db.updateBalance(uid, -amount); }
      }, 40000)
    };
    api.sendMessage(`🧩 RIDDLE\n━━━━━━━━━━━━━━\n${r.q}\n\n💡 Hint: ${r.hint}\n💰 Bet: ${config.currency}${amount}\n⏰ 40 seconds\n\nType ${config.prefix}riddle <answer>`, event.threadID);
  }
};
