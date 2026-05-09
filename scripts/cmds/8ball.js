const responses = [
  "🟢 It is certain.", "🟢 Without a doubt.", "🟢 Yes, definitely!",
  "🟢 You may rely on it.", "🟢 As I see it, yes.", "🟢 Most likely.",
  "🟡 Reply hazy, try again.", "🟡 Ask again later.", "🟡 Cannot predict now.",
  "🔴 Don't count on it.", "🔴 My reply is no.", "🔴 Very doubtful.",
  "🔴 Outlook not so good.", "🟡 Concentrate and ask again.", "🟢 Signs point to yes."
];

module.exports = {
  config: {
    name: "8ball",
    aliases: ["8b", "ask", "magic"],
    description: "Ask the magic 8-ball",
    usage: "8ball <question>",
    cooldown: 3,
    category: "fun"
  },
  run: async ({ api, event, args }) => {
    if (!args.length) return api.sendMessage("🎱 Ask me a question!\nUsage: !8ball <your question>", event.threadID);
    const response = responses[Math.floor(Math.random() * responses.length)];
    api.sendMessage(`🎱 MAGIC 8-BALL\n━━━━━━━━━━━━━━\nQ: ${args.join(" ")}\n\n${response}`, event.threadID);
  }
};
