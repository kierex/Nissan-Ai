module.exports = {
  config: {
    name: "dice",
    aliases: ["roll", "d6"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Roll one or two dice",
    description: { en: "Roll dice — one or two at a time" },
    category: "fun",
    guide: { en: "{pn}dice [2]" }
  },
  onStart: async function ({ message, args }) {
    const count = parseInt(args[0]) === 2 ? 2 : 1;
    const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6));
    const result = rolls.map(r => faces[r] + " " + (r + 1)).join("   ");
    const total = rolls.reduce((a, b) => a + b + 1, 0);
    message.reply(`🎲 DICE ROLL\n━━━━━━━━━━━\n${result}${count === 2 ? "\n\nTotal: " + total : ""}`);
  }
};
