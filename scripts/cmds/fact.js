const facts = [
  "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs!",
  "A group of flamingos is called a 'flamboyance'.",
  "Bananas are berries, but strawberries aren't!",
  "The human brain uses 20% of the body's total energy.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than a year on Venus.",
  "Sharks are older than trees — they've existed for 400 million years.",
  "The Great Wall of China is not visible from space with the naked eye.",
  "Butterflies taste with their feet.",
  "A snail can sleep for 3 years.",
  "Water can boil and freeze at the same time (triple point).",
  "The average person walks about 100,000 miles in their lifetime.",
  "Hot water freezes faster than cold water in some conditions (Mpemba effect).",
  "There are more trees on Earth than stars in the Milky Way.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the pyramids."
];

module.exports = {
  config: {
    name: "fact",
    aliases: ["facts", "funfact", "ff"],
    description: "Get a random fun fact",
    usage: "fact",
    cooldown: 3,
    category: "fun"
  },
  run: async ({ api, event }) => {
    const fact = facts[Math.floor(Math.random() * facts.length)];
    api.sendMessage(`🧠 FUN FACT\n━━━━━━━━━━━━\n${fact}`, event.threadID);
  }
};
