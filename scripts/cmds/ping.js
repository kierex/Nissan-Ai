module.exports = {
  config: {
    name: "ping",
    aliases: ["latency", "speed"],
    description: "Check bot response time",
    usage: "ping",
    cooldown: 3,
    category: "info"
  },
  run: async ({ api, event }) => {
    const start = Date.now();
    api.sendMessage("🏓 Pinging...", event.threadID, () => {
      const ping = Date.now() - start;
      const status = ping < 200 ? "🟢 Excellent" : ping < 500 ? "🟡 Good" : "🔴 Slow";
      api.sendMessage(
        `🏓 PONG!\n` +
        `━━━━━━━━━━━━\n` +
        `⚡ Response : ${ping}ms\n` +
        `📶 Status  : ${status}\n` +
        `🤖 Bot     : NAV BOT`,
        event.threadID
      );
    });
  }
};
