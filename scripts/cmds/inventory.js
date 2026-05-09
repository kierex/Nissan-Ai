module.exports = {
  config: {
    name: "inventory",
    aliases: ["inv", "bag", "items"],
    description: "View your inventory",
    usage: "inventory",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);
    const items = db.getInventory(uid);
    if (!items.length) return api.sendMessage(`🎒 Your inventory is empty!\nPlay games and earn items.`, event.threadID);
    let msg = `🎒 INVENTORY: ${user.name}\n${"━".repeat(22)}\n`;
    for (const item of items) {
      msg += `• ${item.item} x${item.quantity}\n`;
    }
    api.sendMessage(msg, event.threadID);
  }
};
