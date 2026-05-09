const words = ["programming","javascript","facebook","messenger","computer","database","terminal","keyboard","network","browser","password","internet","function","variable","algorithm"];
const stages = ["😵","😨","😰","😟","😣","😬","🙂","😀"];
const active = {};

module.exports = {
  config: {
    name: "hangman",
    aliases: ["hm", "guess"],
    description: "Play hangman and win coins",
    usage: "hangman [amount] | hangman <letter>",
    cooldown: 4,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (active[uid] && args[0] && args[0].length === 1 && /[a-z]/i.test(args[0])) {
      const g = active[uid];
      const letter = args[0].toLowerCase();
      if (g.guessed.includes(letter)) return api.sendMessage(`❌ Already guessed "${letter}"!`, event.threadID);
      g.guessed.push(letter);
      const correct = g.word.includes(letter);
      if (!correct) g.wrong++;
      const display = g.word.split("").map(c => g.guessed.includes(c) ? c : "_").join(" ");
      const won = !display.includes("_");
      const lost = g.wrong >= 6;

      if (won) {
        db.updateBalance(uid, g.reward); db.addExp(uid, 20);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        delete active[uid];
        return api.sendMessage(`🎉 YOU WON! Word: "${g.word}"\n+${config.currency}${g.reward}\n💰 ${db.getBalance(uid).balance}`, event.threadID);
      }
      if (lost) {
        db.updateBalance(uid, -g.reward);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        delete active[uid];
        return api.sendMessage(`💀 GAME OVER! Word was: "${g.word}"\n-${config.currency}${g.reward}\n💰 ${db.getBalance(uid).balance}`, event.threadID);
      }
      return api.sendMessage(
        `${stages[6 - g.wrong]} HANGMAN\n${display}\n❌ Wrong: ${g.wrong}/6\n🔡 Guessed: ${g.guessed.join(", ")}\nType ${config.prefix}hangman <letter>`,
        event.threadID
      );
    }

    if (active[uid]) return api.sendMessage(`🎮 Active game!\n${active[uid].word.split("").map(c => active[uid].guessed.includes(c) ? c : "_").join(" ")}\nGuess: ${config.prefix}hangman <letter>`, event.threadID);

    const amount = parseInt(args[0]) || 100;
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins!`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max 2,000!", event.threadID);

    const word = words[Math.floor(Math.random() * words.length)];
    active[uid] = { word, guessed: [], wrong: 0, reward: amount };
    const display = word.split("").map(() => "_").join(" ");

    api.sendMessage(
      `🎮 HANGMAN STARTED!\n${"━".repeat(20)}\nWord: ${display}\nLength: ${word.length} letters\n💰 Bet: ${config.currency}${amount}\n\nType ${config.prefix}hangman <letter> to guess!`,
      event.threadID
    );
  }
};
