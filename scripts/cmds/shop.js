const shopItems = [
  { id: "shield", name: "🛡️ Shield", price: 500, desc: "Protects from rob (1 use)" },
  { id: "lucky_coin", name: "🍀 Lucky Coin", price: 300, desc: "+10% win chance for 1 game" },
  { id: "double_xp", name: "⚡ Double XP", price: 800, desc: "2x EXP for 1 hour" },
  { id: "vip_badge", name: "💎 VIP Badge", price: 5000, desc: "Show off VIP status" },
  { id: "boost", name: "🚀 Work Boost", price: 400, desc: "+50% work earnings once" },
  { id: "lottery", name: "🎟️ Lottery Ticket", price: 100, desc: "Use with !lottery" }
];

module.exports = {
  config: {
    name: "shop",
    aliases: ["store", "buy"],
    description: "View and buy items from the shop",
    usage: "shop | shop buy <item>",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (args[0] === "buy" && args[1]) {
      const item = shopItems.find(i => i.id === args[1].toLowerCase());
      if (!item) return api.sendMessage(`❌ Item not found! Use ${config.prefix}shop to see all items.`, event.threadID);
      const eco = db.getBalance(uid);
      if (eco.balance < item.price) return api.sendMessage(`❌ Not enough coins! Need: ${config.currency}${item.price}, Have: ${config.currency}${eco.balance}`, event.threadID);
      db.updateBalance(uid, -item.price);
      db.addInventoryItem(uid, item.name);
      return api.sendMessage(
        `✅ PURCHASED!\n${item.name}\n-${config.currency}${item.price}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
        event.threadID
      );
    }

    let msg = `🏪 NAV BOT SHOP\n${"━".repeat(24)}\n`;
    for (const item of shopItems) {
      msg += `\n${item.name}\n  💰 ${config.currency}${item.price} | ${item.desc}\n  Buy: ${config.prefix}shop buy ${item.id}\n`;
    }
    msg += `\n💵 Your balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`;
    api.sendMessage(msg, event.threadID);
  }
};
