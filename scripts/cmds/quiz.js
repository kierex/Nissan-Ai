const questions = [
  { q: "What is the capital of France?", a: "paris", hint: "City of Love" },
  { q: "What is 2 + 2 × 2?", a: "6", hint: "Order of operations" },
  { q: "What planet is known as the Red Planet?", a: "mars", hint: "Roman god of war" },
  { q: "How many sides does a hexagon have?", a: "6", hint: "Six" },
  { q: "What is the largest ocean?", a: "pacific", hint: "Means peaceful" },
  { q: "Who invented the telephone?", a: "bell", hint: "Alexander Graham ___" },
  { q: "What is the chemical symbol for gold?", a: "au", hint: "From Latin aurum" },
  { q: "How many continents are there?", a: "7", hint: "Seven" },
  { q: "What is the fastest land animal?", a: "cheetah", hint: "Big spotted cat" },
  { q: "What year did World War 2 end?", a: "1945", hint: "Mid 1940s" },
  { q: "What is H2O?", a: "water", hint: "You drink it daily" },
  { q: "How many legs does a spider have?", a: "8", hint: "Eight" },
  { q: "What is the square root of 144?", a: "12", hint: "Dozen" },
  { q: "What gas do plants absorb?", a: "carbon dioxide", hint: "CO2" },
  { q: "Who painted the Mona Lisa?", a: "leonardo da vinci", hint: "Italian Renaissance man" },
  { q: "What is the longest river in the world?", a: "nile", hint: "In Africa" },
  { q: "What is the smallest country?", a: "vatican", hint: "In Rome" },
  { q: "How many days in a leap year?", a: "366", hint: "Extra day in February" },
  { q: "What is the hardest natural substance?", a: "diamond", hint: "Used in rings" },
  { q: "What language has the most native speakers?", a: "mandarin", hint: "Chinese language" }
];

const activeQuizzes = {};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["trivia", "question"],
    description: "Answer a trivia question to earn coins",
    usage: "quiz [amount]",
    cooldown: 5,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    if (activeQuizzes[uid]) {
      const answer = args.join(" ").toLowerCase().trim();
      const quiz = activeQuizzes[uid];
      clearTimeout(quiz.timeout);
      delete activeQuizzes[uid];

      if (answer === quiz.answer) {
        const reward = quiz.reward;
        db.updateBalance(uid, reward);
        db.addExp(uid, 15);
        db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
        return api.sendMessage(
          `✅ CORRECT! 🎉\n` +
          `Answer: ${quiz.answer}\n` +
          `+${config.currency}${reward} earned!\n` +
          `💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
          event.threadID
        );
      } else {
        db.updateBalance(uid, -quiz.reward);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        return api.sendMessage(
          `❌ WRONG!\n` +
          `Correct answer: ${quiz.answer}\n` +
          `-${config.currency}${quiz.reward} lost\n` +
          `💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`,
          event.threadID
        );
      }
    }

    const amount = parseInt(args[0]) || 100;
    if (amount < 1) return api.sendMessage("❌ Minimum bet is 1 coin.", event.threadID);
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 2000) return api.sendMessage("❌ Max bet is 2,000!", event.threadID);

    const q = questions[Math.floor(Math.random() * questions.length)];

    activeQuizzes[uid] = {
      answer: q.a,
      reward: amount,
      timeout: setTimeout(() => {
        if (activeQuizzes[uid]) {
          delete activeQuizzes[uid];
          api.sendMessage(`⏰ Time's up! Answer was: ${q.a}\nYou lost ${config.currency}${amount}`, event.threadID);
          db.updateBalance(uid, -amount);
        }
      }, 30000)
    };

    api.sendMessage(
      `❓ QUIZ TIME!\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `${q.q}\n\n` +
      `💡 Hint: ${q.hint}\n` +
      `💰 Bet: ${config.currency}${amount}\n` +
      `⏰ Time: 30 seconds\n\n` +
      `Type ${config.prefix}quiz <your answer> to reply!`,
      event.threadID
    );
  }
};
