const signs = {
  aries: { emoji: "♈", dates: "Mar 21 - Apr 19", trait: "Bold and ambitious" },
  taurus: { emoji: "♉", dates: "Apr 20 - May 20", trait: "Reliable and patient" },
  gemini: { emoji: "♊", dates: "May 21 - Jun 20", trait: "Adaptable and curious" },
  cancer: { emoji: "♋", dates: "Jun 21 - Jul 22", trait: "Intuitive and emotional" },
  leo: { emoji: "♌", dates: "Jul 23 - Aug 22", trait: "Dramatic and passionate" },
  virgo: { emoji: "♍", dates: "Aug 23 - Sep 22", trait: "Analytical and practical" },
  libra: { emoji: "♎", dates: "Sep 23 - Oct 22", trait: "Social and fair-minded" },
  scorpio: { emoji: "♏", dates: "Oct 23 - Nov 21", trait: "Determined and brave" },
  sagittarius: { emoji: "♐", dates: "Nov 22 - Dec 21", trait: "Adventurous and optimistic" },
  capricorn: { emoji: "♑", dates: "Dec 22 - Jan 19", trait: "Responsible and disciplined" },
  aquarius: { emoji: "♒", dates: "Jan 20 - Feb 18", trait: "Innovative and original" },
  pisces: { emoji: "♓", dates: "Feb 19 - Mar 20", trait: "Intuitive and empathetic" }
};
const forecasts = ["Great things are coming your way! 🌟", "Focus on self-improvement today 💪", "Love is in the air ❤️", "Financial opportunities await 💰", "Take risks — fortune favors the bold 🎯", "Rest and recharge for what's ahead 🌙", "Connections you make today will matter 🤝", "Trust your instincts — they're right 🧭"];

module.exports = {
  config: {
    name: "horoscope",
    aliases: ["zodiac", "star"],
    description: "Get your daily horoscope",
    usage: "horoscope <sign>",
    cooldown: 5,
    category: "fun"
  },
  run: async ({ api, event, args }) => {
    const sign = (args[0] || "").toLowerCase();
    if (!sign) {
      const list = Object.entries(signs).map(([k, v]) => `${v.emoji} ${k} (${v.dates})`).join("\n");
      return api.sendMessage(`✨ HOROSCOPE SIGNS\n━━━━━━━━━━━━━━━━━\n${list}\n\nUsage: !horoscope <sign>`, event.threadID);
    }
    const data = signs[sign];
    if (!data) return api.sendMessage("❌ Invalid sign! Use !horoscope to see all signs.", event.threadID);
    const forecast = forecasts[Math.floor(Math.random() * forecasts.length)];
    const lucky = Math.floor(Math.random() * 100);
    api.sendMessage(
      `${data.emoji} ${sign.toUpperCase()} HOROSCOPE\n━━━━━━━━━━━━━━━━━━\n📅 ${data.dates}\n💫 Trait: ${data.trait}\n\n✨ Today's Forecast:\n${forecast}\n\n🍀 Lucky Number: ${lucky}\n❤️ Love: ${"⭐".repeat(Math.floor(Math.random()*5)+1)}\n💰 Money: ${"⭐".repeat(Math.floor(Math.random()*5)+1)}`,
      event.threadID
    );
  }
};
