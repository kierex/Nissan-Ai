module.exports = {
  config: {
    name: "love",
    aliases: ["lovemeter", "ship"],
    description: "Calculate love compatibility",
    usage: "love @mention1 @mention2",
    cooldown: 3,
    category: "fun"
  },
  run: async ({ api, event, args }) => {
    const mentions = event.mentions ? Object.keys(event.mentions) : [];
    let name1, name2;
    if (mentions.length >= 2) {
      name1 = event.mentions[mentions[0]];
      name2 = event.mentions[mentions[1]];
    } else {
      name1 = args[0] || "Person 1";
      name2 = args[1] || "Person 2";
    }
    const pct = Math.floor(Math.random() * 101);
    const bar = "❤️".repeat(Math.floor(pct / 10)) + "🖤".repeat(10 - Math.floor(pct / 10));
    let msg;
    if (pct >= 90) msg = "💍 Perfect match! Soulmates!";
    else if (pct >= 70) msg = "💕 Great chemistry! Keep it up!";
    else if (pct >= 50) msg = "💛 Pretty good! Worth a try!";
    else if (pct >= 30) msg = "💔 Not ideal, but anything is possible!";
    else msg = "😬 Maybe just friends...";

    api.sendMessage(
      `💕 LOVE METER\n━━━━━━━━━━━━━━\n${name1} ❤️ ${name2}\n\n${bar}\n${pct}% Match!\n\n${msg}`,
      event.threadID
    );
  }
};
