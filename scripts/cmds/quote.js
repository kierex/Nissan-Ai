const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" }
];

module.exports = {
  config: {
    name: "quote",
    aliases: ["q", "inspire", "motivation"],
    description: "Get an inspiring quote",
    usage: "quote",
    cooldown: 3,
    category: "fun"
  },
  run: async ({ api, event }) => {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    api.sendMessage(`💬 QUOTE OF THE DAY\n━━━━━━━━━━━━━━━━━\n"${q.text}"\n\n— ${q.author}`, event.threadID);
  }
};
