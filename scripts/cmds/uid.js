module.exports = {
  config: {
    name: "uid",
    aliases: ["id", "getid"],
    description: "Get your or someone's UID",
    usage: "uid [@mention]",
    cooldown: 3,
    category: "utility"
  },
  run: async ({ api, event }) => {
    const mentioned = event.mentions && Object.keys(event.mentions);
    if (mentioned && mentioned.length > 0) {
      const msgs = mentioned.map(uid => `👤 ${event.mentions[uid]}: ${uid}`).join("\n");
      return api.sendMessage(`🆔 USER IDs\n━━━━━━━━━━━\n${msgs}`, event.threadID);
    }
    api.sendMessage(
      `🆔 YOUR INFO\n━━━━━━━━━━━━\n` +
      `👤 UID: ${event.senderID}\n` +
      `💬 Thread ID: ${event.threadID}`,
      event.threadID
    );
  }
};
