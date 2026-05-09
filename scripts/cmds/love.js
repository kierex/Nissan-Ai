module.exports = {
  config: {
    name: "love",
    aliases: ["ship", "lovelevel"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Calculate love compatibility",
    description: { en: "Calculate love compatibility between two names" },
    category: "fun",
    guide: { en: "{pn}love <name1> & <name2>" }
  },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("Usage: !love Alice & Bob");
    const input = args.join(" ");
    const [n1, n2] = input.includes("&") ? input.split("&").map(s => s.trim()) : [input, "???"];
    let score = 0;
    for (const c of (n1 + n2).toLowerCase()) score += c.charCodeAt(0);
    score = ((score % 100) + 100) % 100;
    const bars = Math.floor(score / 10);
    const meter = "❤️".repeat(bars) + "🖤".repeat(10 - bars);
    let verdict;
    if (score >= 90) verdict = "💞 SOULMATES! Perfect match!";
    else if (score >= 70) verdict = "💕 Great match!";
    else if (score >= 50) verdict = "💛 Pretty good!";
    else if (score >= 30) verdict = "🤍 Some work needed.";
    else verdict = "💔 Hmm... maybe not meant to be.";
    message.reply(`💘 LOVE CALCULATOR\n━━━━━━━━━━━━━━━━━\n${n1} ❤️ ${n2}\n\n${meter}\n\n💯 Score: ${score}%\n${verdict}`);
  }
};
