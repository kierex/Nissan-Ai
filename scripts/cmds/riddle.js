module.exports = {
  config: {
    name: "riddle",
    aliases: ["brain", "puzzle"],
    version: "1.0",
    author: "CowBot",
    countDown: 5,
    role: 0,
    shortDescription: "Get a brain riddle",
    description: { en: "Get a random brain riddle to solve" },
    category: "fun",
    guide: { en: "{pn}riddle [answer]" }
  },
  langs: {
    en: {
      hint: "💡 Hint: Reply with {pn}riddle answer <your answer>"
    }
  },
  onStart: async function ({ message, args, event, threadsData }) {
    const riddles = [
      { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?", a: "map" },
      { q: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
      { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "echo" },
      { q: "What has hands but can't clap?", a: "clock" },
      { q: "What gets wet while drying?", a: "towel" },
      { q: "I'm tall when I'm young, and short when I'm old. What am I?", a: "candle" },
      { q: "What has teeth but can't bite?", a: "comb" },
      { q: "What has a head, a tail, but no body?", a: "coin" },
      { q: "What goes up but never comes down?", a: "age" },
      { q: "I have keys but no locks. I have space but no room. You can enter but can't go inside. What am I?", a: "keyboard" }
    ];
    if (args[0] === "answer") {
      const userAns = args.slice(1).join(" ").toLowerCase().trim();
      let stored;
      try { stored = (await threadsData.get(event.threadID, "data"))?.activeRiddle; } catch(e) {}
      if (!stored) return message.reply("❌ No active riddle. Start one with !riddle");
      if (userAns.includes(stored.a)) {
        try { await threadsData.set(event.threadID, { data: { ...((await threadsData.get(event.threadID, "data")) || {}), activeRiddle: null } }); } catch(e) {}
        return message.reply("🎉 CORRECT! That's right! The answer was: " + stored.a);
      }
      return message.reply("❌ Wrong answer! Keep thinking...");
    }
    const riddle = riddles[Math.floor(Math.random() * riddles.length)];
    try { await threadsData.set(event.threadID, { data: { ...((await threadsData.get(event.threadID, "data")) || {}), activeRiddle: riddle } }); } catch(e) {}
    message.reply(`🧩 RIDDLE\n━━━━━━━━━━━━\n${riddle.q}\n\n💡 Answer: !riddle answer <your guess>`);
  }
};
