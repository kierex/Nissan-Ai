const words = [
  { word: "apple", hint: "A fruit" }, { word: "ocean", hint: "Large body of water" },
  { word: "music", hint: "Art of sound" }, { word: "cloud", hint: "In the sky" },
  { word: "flame", hint: "Fire produces this" }, { word: "magic", hint: "Illusions and spells" },
  { word: "tiger", hint: "Striped big cat" }, { word: "storm", hint: "Thunder and lightning" },
  { word: "brave", hint: "Being courageous" }, { word: "dream", hint: "While sleeping" },
  { word: "earth", hint: "Our planet" }, { word: "frost", hint: "Cold ice crystals" },
  { word: "ghost", hint: "Supernatural spirit" }, { word: "honey", hint: "Made by bees" },
  { word: "image", hint: "A picture" }, { word: "judge", hint: "In a courtroom" },
  { word: "knife", hint: "Cutting tool" }, { word: "light", hint: "From the sun" },
  { word: "money", hint: "Currency" }, { word: "night", hint: "After sunset" }
];
const active = {};

module.exports = {
  config: {
    name: "word",
    aliases: ["unscramble", "wordle"],
    description: "Unscramble the word to win coins",
    usage: "word [amount]",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (active[uid]) {
      const guess = args.join("").toLowerCase().trim();
      const g = active[uid];
      clearTimeout(g.timeout);
      delete active[uid];
      if (guess === g.word) {
        db.updateBalance(uid, g.reward);
        db.addExp(uid, 12);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        return api.sendMessage(`✅ CORRECT! The word was "${g.word}"!\n+${config.currency}${g.reward}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      } else {
        db.updateBalance(uid, -g.reward);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        return api.sendMessage(`❌ Wrong! The word was "${g.word}"\n-${config.currency}${g.reward}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance}`, event.threadID);
      }
    }

    const amount = parseInt(args[0]) || 100;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max bet 2,000!", event.threadID);

    const w = words[Math.floor(Math.random() * words.length)];
    const scrambled = w.word.split("").sort(() => Math.random() - 0.5).join("");

    active[uid] = {
      word: w.word, reward: amount,
      timeout: setTimeout(() => {
        if (active[uid]) { delete active[uid]; api.sendMessage(`⏰ Time's up! Word was: ${w.word}\n-${config.currency}${amount}`, event.threadID); db.updateBalance(uid, -amount); }
      }, 25000)
    };

    api.sendMessage(
      `🔤 WORD SCRAMBLE\n━━━━━━━━━━━━━━━━\n` +
      `Scrambled: ${scrambled.toUpperCase()}\n` +
      `Hint: ${w.hint}\n` +
      `💰 Bet: ${config.currency}${amount}\n⏰ 25 seconds\n\nType ${config.prefix}word <answer>`,
      event.threadID
    );
  }
};
