const questions = [
  ["Have unlimited money but no friends", "Have loyal friends but no money"],
  ["Be invisible", "Be able to fly"],
  ["Live in the past", "Live in the future"],
  ["Know when you die", "Know how you die"],
  ["Always be 10 minutes late", "Always be 20 minutes early"],
  ["Speak every language", "Play every instrument"],
  ["Have super strength", "Have super speed"],
  ["Never sleep", "Never eat"],
  ["Be famous", "Be rich but anonymous"],
  ["Live underwater", "Live on the moon"]
];

module.exports = {
  config: {
    name: "wyr",
    aliases: ["wouldyourather", "would"],
    description: "Would You Rather game",
    usage: "wyr",
    cooldown: 3,
    category: "fun"
  },
  run: async ({ api, event }) => {
    const q = questions[Math.floor(Math.random() * questions.length)];
    api.sendMessage(
      `🤔 WOULD YOU RATHER?\n━━━━━━━━━━━━━━━━━━━\n1️⃣ ${q[0]}\n\n             OR\n\n2️⃣ ${q[1]}\n\nReply with your choice!`,
      event.threadID
    );
  }
};
