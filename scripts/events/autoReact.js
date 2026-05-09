const reactions = ["😍", "❤️", "😂", "🔥", "👏", "🎉", "💯", "😎"];
let reactCount = 0;

module.exports = {
  config: { name: "autoReact", description: "Auto react to messages randomly" },
  run: async ({ api, event, config }) => {
    if (event.type !== "message" && event.type !== "message_reply") return;
    if (!config.features?.autoReact) return;
    if (event.senderID === api.getCurrentUserID()) return;
    reactCount++;
    if (reactCount % 10 !== 0) return;
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    try {
      api.setMessageReaction(reaction, event.messageID, () => {}, true);
    } catch {}
  }
};
