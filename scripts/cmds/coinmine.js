module.exports = {
  config: {
    name: "mine",
    aliases: ["coinmine", "dig"],
    description: "Mine for coins and rare gems",
    usage: "mine",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const lastMine = db.prepare("SELECT value FROM bot_stats WHERE key = ?").get(`mine_${uid}`);
    const cooldownMs = 1800000;
    if (lastMine) {
      const elapsed = Date.now() - parseInt(lastMine.value);
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
        return api.sendMessage(`⛏️ Mining on cooldown! Return in ${remaining} min.`, event.threadID);
      }
    }

    const outcomes = [
      { emoji: "💰", name: "Gold", min: 50, max: 200, chance: 40 },
      { emoji: "💎", name: "Diamond", min: 200, max: 600, chance: 15 },
      { emoji: "🪨", name: "Rock", min: 5, max: 30, chance: 30 },
      { emoji: "🔮", name: "Crystal", min: 100, max: 400, chance: 10 },
      { emoji: "🌟", name: "Star Ore", min: 400, max: 1000, chance: 5 }
    ];

    const r = Math.random() * 100;
    let cumulative = 0;
    let found = outcomes[0];
    for (const o of outcomes) {
      cumulative += o.chance;
      if (r <= cumulative) { found = o; break; }
    }

    const earned = Math.floor(Math.random() * (found.max - found.min + 1)) + found.min;
    db.updateBalance(uid, earned);
    db.addExp(uid, 8);
    db.prepare("INSERT OR REPLACE INTO bot_stats (key, value) VALUES (?, ?)").run(`mine_${uid}`, Date.now().toString());

    api.sendMessage(
      `⛏️ MINING RESULTS\n━━━━━━━━━━━━━━━━\nYou found: ${found.emoji} ${found.name}!\n+${config.currency}${earned}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}\n\n⏰ Next mine in 30 minutes`,
      event.threadID
    );
  }
};
