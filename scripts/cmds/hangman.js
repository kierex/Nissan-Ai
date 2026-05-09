module.exports = {
  config: {
    name: "hangman",
    aliases: ["hm", "wordguess"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Play Hangman",
    description: { en: "Play hangman — guess the hidden word letter by letter" },
    category: "game",
    guide: { en: "{pn}hangman [letter] or new" }
  },
  onStart: async function ({ message, args, event, threadsData }) {
    const tid = event.threadID;
    const uid = event.senderID;
    const words = ["javascript","facebook","messenger","cowbot","elephant","keyboard","programming","database","beautiful","challenge","adventure","chocolate","butterfly","universe","mountain"];
    const stages = ["😐","😟","😧","😨","😱","💀"];
    let state;
    try { state = (await threadsData.get(tid, "data"))?.hm?.[uid]; } catch(e) {}
    const action = (args[0] || "new").toLowerCase();
    if (action === "new" || !state) {
      const word = words[Math.floor(Math.random() * words.length)];
      state = { word, guessed: [], wrong: 0 };
      try { const d = await threadsData.get(tid, "data") || {}; if(!d.hm) d.hm = {}; d.hm[uid] = state; await threadsData.set(tid, { data: d }); } catch(e) {}
      const display = word.split("").map(c => "_").join(" ");
      return message.reply(`💀 HANGMAN\n━━━━━━━━━━━\n${stages[0]} Word: ${display}\nLength: ${word.length} letters\n\nGuess with !hangman <letter>`);
    }
    if (action.length !== 1 || !/[a-z]/.test(action)) return message.reply("Guess one letter at a time! e.g. !hangman a");
    if (state.guessed.includes(action)) return message.reply("You already guessed '" + action + "'!");
    state.guessed.push(action);
    if (!state.word.includes(action)) state.wrong++;
    const display = state.word.split("").map(c => state.guessed.includes(c) ? c : "_").join(" ");
    const won = !display.includes("_");
    const lost = state.wrong >= 5;
    try { const d = await threadsData.get(tid, "data") || {}; if(!d.hm) d.hm = {}; if(won||lost) delete d.hm[uid]; else d.hm[uid] = state; await threadsData.set(tid, { data: d }); } catch(e) {}
    if (won) return message.reply(`💀 HANGMAN\n━━━━━━━━━━━\n🎉 YOU WIN!\nWord: ${state.word}\nGuessed: ${state.guessed.join(", ")}`);
    if (lost) return message.reply(`💀 HANGMAN\n━━━━━━━━━━━\n${stages[5]} GAME OVER!\nThe word was: ${state.word}`);
    message.reply(`💀 HANGMAN\n━━━━━━━━━━━\n${stages[state.wrong]} Word: ${display}\nWrong: ${state.wrong}/5\nGuessed: ${state.guessed.join(", ")}\n\nGuess: !hangman <letter>`);
  }
};
