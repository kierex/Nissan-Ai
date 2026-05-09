module.exports = {
  config: {
    name: "quote",
    aliases: ["inspire", "motivation"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Get an inspirational quote",
    description: { en: "Sends a random motivational quote" },
    category: "fun",
    guide: { en: "{pn}quote" }
  },
  onStart: async function ({ message }) {
    const quotes = [
      ["You miss 100% of the shots you don't take.", "Wayne Gretzky"],
      ["Life is what happens when you're busy making other plans.", "John Lennon"],
      ["The way to get started is to quit talking and begin doing.", "Walt Disney"],
      ["Innovation distinguishes between a leader and a follower.", "Steve Jobs"],
      ["Your time is limited, don't waste it living someone else's life.", "Steve Jobs"],
      ["If life were predictable it would cease to be life.", "Eleanor Roosevelt"],
      ["Spread love everywhere you go. Let no one ever come to you without leaving happier.", "Mother Teresa"],
      ["When you reach the end of your rope, tie a knot in it and hang on.", "Franklin D. Roosevelt"],
      ["Always remember that you are absolutely unique. Just like everyone else.", "Margaret Mead"],
      ["Don't judge each day by the harvest you reap but by the seeds that you plant.", "Robert Louis Stevenson"],
      ["The future belongs to those who believe in the beauty of their dreams.", "Eleanor Roosevelt"],
      ["It is during our darkest moments that we must focus to see the light.", "Aristotle"]
    ];
    const [q, author] = quotes[Math.floor(Math.random() * quotes.length)];
    message.reply(`💬 QUOTE OF THE DAY\n━━━━━━━━━━━━━━━━━\n"${q}"\n\n— ${author}`);
  }
};
