module.exports = {
  config: {
    name: "joke",
    aliases: ["lol", "funny"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Get a random joke",
    description: { en: "Sends a random clean joke" },
    category: "fun",
    guide: { en: "{pn}joke" }
  },
  onStart: async function ({ message }) {
    const jokes = [
      ["Why don't scientists trust atoms?", "Because they make up everything!"],
      ["Why did the scarecrow win an award?", "Because he was outstanding in his field!"],
      ["How does a penguin build its house?", "Igloos it together!"],
      ["Why can't you give Elsa a balloon?", "Because she'll let it go!"],
      ["What do you call a fake noodle?", "An impasta!"],
      ["Why did the bicycle fall over?", "Because it was two-tired!"],
      ["What do you call cheese that isn't yours?", "Nacho cheese!"],
      ["Why do cows wear bells?", "Because their horns don't work!"],
      ["What do you call a sleeping dinosaur?", "A dino-snore!"],
      ["How do you organize a space party?", "You planet!"],
      ["Why did the math book look sad?", "It had too many problems."],
      ["What do you call a fish without eyes?", "A fsh!"]
    ];
    const [setup, punchline] = jokes[Math.floor(Math.random() * jokes.length)];
    message.reply(`😂 JOKE TIME!\n━━━━━━━━━━━━━\n${setup}\n\n💥 ${punchline}`);
  }
};
