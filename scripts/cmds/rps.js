module.exports = {
  config: {
    name: "rps",
    aliases: ["rockpaperscissors"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Rock Paper Scissors",
    description: { en: "Play Rock Paper Scissors against the bot" },
    category: "game",
    guide: { en: "{pn}rps <rock|paper|scissors>" }
  },
  onStart: async function ({ message, args }) {
    const choices = ["rock", "paper", "scissors"];
    const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
    const player = args[0]?.toLowerCase();
    if (!choices.includes(player)) return message.reply("Usage: !rps rock | paper | scissors");
    const bot = choices[Math.floor(Math.random() * 3)];
    let result;
    if (player === bot) result = "🟡 It's a TIE!";
    else if ((player === "rock" && bot === "scissors") || (player === "paper" && bot === "rock") || (player === "scissors" && bot === "paper")) result = "🟢 You WIN!";
    else result = "🔴 You LOSE!";
    message.reply(`✊ ROCK PAPER SCISSORS\n━━━━━━━━━━━━━━━━━━━\nYou : ${emojis[player]} ${player}\nBot : ${emojis[bot]} ${bot}\n\n${result}`);
  }
};
