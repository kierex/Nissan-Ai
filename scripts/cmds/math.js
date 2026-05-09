module.exports = {
  config: {
    name: "math",
    aliases: ["calc", "calculate"],
    version: "1.0",
    author: "CowBot",
    countDown: 2,
    role: 0,
    shortDescription: "Solve a math expression",
    description: { en: "Calculate any mathematical expression" },
    category: "tools",
    guide: { en: "{pn}math <expression>" }
  },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("Usage: !math 2 + 2 * 10");
    const expr = args.join(" ").replace(/[^0-9+\-*/().%^ ]/g, "").trim();
    if (!expr) return message.reply("❌ Invalid expression. Only numbers and operators allowed.");
    try {
      const safeExpr = expr.replace(/\^/g, "**");
      const result = Function('"use strict"; return (' + safeExpr + ')')();
      if (!isFinite(result)) return message.reply("❌ Result is undefined (division by zero?)");
      message.reply(`🧮 CALCULATOR\n━━━━━━━━━━━━━\n📝 ${expr}\n\n✅ = ${result}`);
    } catch (e) {
      message.reply("❌ Invalid math expression.");
    }
  }
};
