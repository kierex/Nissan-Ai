module.exports = {
  config: {
    name: "rob",
    aliases: ["steal", "heist"],
    version: "1.0",
    author: "CowBot",
    countDown: 7200,
    role: 0,
    shortDescription: "Try to rob another user",
    description: { en: "Attempt to rob coins from another user (risky!)" },
    category: "economy",
    guide: { en: "{pn}rob @mention" }
  },
  onStart: async function ({ message, event, usersData }) {
    const mentions = Object.keys(event.mentions || {});
    if (!mentions.length) return message.reply("❌ Mention someone to rob!\nUsage: !rob @someone");
    const target = mentions[0];
    if (target === event.senderID) return message.reply("❌ You can't rob yourself!");
    const success = Math.random() < 0.45;
    if (!success) {
      message.reply("🚔 ROB FAILED!\n━━━━━━━━━━━━━\nYou got caught! Cops fined you 200 coins!\n\n😅 Better luck next time!");
      try { const u = await usersData.get(event.senderID); await usersData.set(event.senderID, { money: Math.max(0, (u.money||0) - 200) }); } catch(e) {}
      return;
    }
    const stolen = Math.floor(Math.random() * 400) + 100;
    try {
      const robber = await usersData.get(event.senderID);
      const victim = await usersData.get(target);
      const canSteal = Math.min(stolen, victim.money || 0);
      if (canSteal === 0) return message.reply("❌ Target has no coins to steal!");
      await usersData.set(event.senderID, { money: (robber.money || 0) + canSteal });
      await usersData.set(target, { money: Math.max(0, (victim.money || 0) - canSteal) });
      message.reply(`🦹 ROB SUCCESS!\n━━━━━━━━━━━━━\nYou stole ${canSteal} coins!\n\n⚠️ Cooldown: 2 hours`);
    } catch(e) {
      message.reply("❌ Error processing robbery.");
    }
  }
};
