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
    api.sendMessage("🏓 Pinging...", event.threadID, (err, info) => {
      const ping = Date.now() - start;
      api.editMessage(
        `🏓 PONG!\n⚡ Response: ${ping}ms\n${ping < 200 ? "🟢 Excellent" : ping < 500 ? "🟡 Good" : "🔴 Slow"}`,
        info.messageID
      );
    });
  }
};
