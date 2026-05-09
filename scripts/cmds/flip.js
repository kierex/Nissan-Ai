module.exports = {
  config: {
    name: "flip",
    aliases: ["coin", "coinflip"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Flip a coin",
    description: { en: "Flip a coin — heads or tails" },
    category: "fun",
    guide: { en: "{pn}flip" }
  },
  onStart: async function ({ message }) {
    const result = Math.random() < 0.5;
    message.reply(`🪙 COIN FLIP\n━━━━━━━━━━━\n${result ? "🌟 HEADS" : "🌑 TAILS"}\n\n${result ? "Shine bright!" : "Better luck next time!"}`);
  }
};
