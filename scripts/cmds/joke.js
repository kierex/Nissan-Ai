const jokes = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs! 🐛" },
  { setup: "Why did the computer go to the doctor?", punchline: "It had a virus! 🦠" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh! 🐟" },
  { setup: "Why can't a bicycle stand on its own?", punchline: "Because it's two-tired! 🚲" },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved! 🌊" },
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything! ⚛️" },
  { setup: "What's a skeleton's least favorite room?", punchline: "The living room! 💀" },
  { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field! 🌾" },
  { setup: "What do you call fake spaghetti?", punchline: "An impasta! 🍝" },
  { setup: "How does a penguin build its house?", punchline: "Igloos it together! 🐧" }
];

module.exports = {
  config: {
    name: "joke",
    aliases: ["jk", "funny"],
    description: "Get a random joke",
    usage: "joke",
    cooldown: 3,
    category: "fun"
  },
  run: async ({ api, event }) => {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    api.sendMessage(`😂 JOKE TIME!\n━━━━━━━━━━━━━\n${joke.setup}\n\n${joke.punchline}`, event.threadID);
  }
};
