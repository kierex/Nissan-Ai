module.exports = {
  config: {
    name: "fish",
    aliases: ["fishing", "cast"],
    description: "Go fishing to earn coins",
    usage: "fish",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const lastFish = db.prepare("SELECT value FROM bot_stats WHERE key = ?").get(`fish_${uid}`);
    const cooldownMs = 900000;
    if (lastFish) {
      const elapsed = Date.now() - parseInt(lastFish.value);
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
        return api.sendMessage(`🎣 Fishing cooldown! Return in ${remaining} min.`, event.threadID);
      }
    }

    const catches = [
      { emoji: "🐟", name: "Small Fish", value: [20, 60], chance: 35 },
      { emoji: "🐠", name: "Tropical Fish", value: [50, 150], chance: 25 },
      { emoji: "🐡", name: "Pufferfish", value: [30, 90], chance: 20 },
      { emoji: "🦈", name: "Shark!", value: [200, 600], chance: 5 },
      { emoji: "🐙", name: "Octopus", value: [100, 300], chance: 10 },
      { emoji: "💎", name: "Sunken Treasure", value: [500, 1500], chance: 3 },
      { emoji: "👢", name: "Old Boot (trash)", value: [0, 5], chance: 2 }
    ];

    const r = Math.random() * 100;
    let cumulative = 0;
    let found = catches[0];
    for (const c of catches) {
      cumulative += c.chance;
      if (r <= cumulative) { found = c; break; }
    }

    const earned = Math.floor(Math.random() * (found.value[1] - found.value[0] + 1)) + found.value[0];
    if (earned > 0) db.updateBalance(uid, earned);
    db.addExp(uid, 6);
    db.prepare("INSERT OR REPLACE INTO bot_stats (key, value) VALUES (?, ?)").run(`fish_${uid}`, Date.now().toString());

    const msg = found.name === "Old Boot (trash)" ? "🤢 Better luck next time!" : `+${config.currency}${earned}`;
    api.sendMessage(
      `🎣 FISHING RESULTS\n━━━━━━━━━━━━━━━━\nYou caught: ${found.emoji} ${found.name}!\n${msg}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}\n\n⏰ Fish again in 15 min`,
      event.threadID
    );
  }
};
