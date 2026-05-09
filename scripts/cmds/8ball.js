module.exports = {
  config: {
    name: "8ball",
    aliases: ["eightball", "magic"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Ask the Magic 8-Ball",
    description: { en: "Ask the magic 8-ball a yes/no question" },
    category: "fun",
    guide: { en: "{pn}8ball <your question>" }
  },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("🎱 Please ask a question!\nUsage: !8ball will it work?");
    const answers = [
      "🟢 It is certain", "🟢 Without a doubt", "🟢 Yes definitely",
      "🟢 You may rely on it", "🟢 As I see it, yes", "🟢 Most likely",
      "🟡 Reply hazy, try again", "🟡 Ask again later", "🟡 Cannot predict now",
      "🔴 Don't count on it", "🔴 My reply is no", "🔴 Very doubtful",
      "🔴 Outlook not so good", "🔴 My sources say no"
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    message.reply(`🎱 MAGIC 8-BALL\n━━━━━━━━━━━━━━\nQ: ${args.join(" ")}\n\n${answer}`);
  }
};
