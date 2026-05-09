module.exports = {
  config: {
    name: "horoscope",
    aliases: ["zodiac", "star"],
    version: "1.0",
    author: "CowBot",
    countDown: 5,
    role: 0,
    shortDescription: "Get your daily horoscope",
    description: { en: "Get a daily horoscope for any zodiac sign" },
    category: "fun",
    guide: { en: "{pn}horoscope <sign>" }
  },
  onStart: async function ({ message, args }) {
    const signs = {
      aries: { emoji:"♈", dates:"Mar 21 - Apr 19", trait:"Courageous" },
      taurus: { emoji:"♉", dates:"Apr 20 - May 20", trait:"Reliable" },
      gemini: { emoji:"♊", dates:"May 21 - Jun 20", trait:"Adaptable" },
      cancer: { emoji:"♋", dates:"Jun 21 - Jul 22", trait:"Nurturing" },
      leo: { emoji:"♌", dates:"Jul 23 - Aug 22", trait:"Confident" },
      virgo: { emoji:"♍", dates:"Aug 23 - Sep 22", trait:"Analytical" },
      libra: { emoji:"♎", dates:"Sep 23 - Oct 22", trait:"Diplomatic" },
      scorpio: { emoji:"♏", dates:"Oct 23 - Nov 21", trait:"Passionate" },
      sagittarius: { emoji:"♐", dates:"Nov 22 - Dec 21", trait:"Adventurous" },
      capricorn: { emoji:"♑", dates:"Dec 22 - Jan 19", trait:"Disciplined" },
      aquarius: { emoji:"♒", dates:"Jan 20 - Feb 18", trait:"Innovative" },
      pisces: { emoji:"♓", dates:"Feb 19 - Mar 20", trait:"Intuitive" }
    };
    const readings = ["Today brings unexpected opportunities. Stay open-minded and embrace change.", "Focus on your relationships today — deep conversations lead to breakthroughs.", "Your energy is at its peak. Channel it into your most important goals.", "A creative idea you've been sitting on is ready to come to life.", "Financial news brings good vibes. Trust your instincts with money matters.", "Take time to recharge — rest is productive too.", "Social connections open a new door today. Say yes to invitations.", "A challenge you've been avoiding is easier than it looks. Face it."];
    const sign = args[0]?.toLowerCase();
    if (!sign || !signs[sign]) return message.reply("Signs: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces");
    const s = signs[sign];
    const reading = readings[Math.floor(Math.random() * readings.length)];
    const luck = ["🍀 Excellent","✨ Good","⚡ Average","💡 Favorable"][Math.floor(Math.random() * 4)];
    const num = Math.floor(Math.random() * 99) + 1;
    message.reply(`${s.emoji} ${sign.toUpperCase()} HOROSCOPE\n━━━━━━━━━━━━━━━━━━\n📅 ${s.dates}\n💫 Trait: ${s.trait}\n\n📖 ${reading}\n\n🎯 Lucky #: ${num}\n🌟 Luck: ${luck}`);
  }
};
