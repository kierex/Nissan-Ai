module.exports = {
  config: {
    name: "fact",
    aliases: ["funfact", "trivia"],
    version: "1.0",
    author: "CowBot",
    countDown: 3,
    role: 0,
    shortDescription: "Get a random fun fact",
    description: { en: "Sends a random interesting fun fact" },
    category: "fun",
    guide: { en: "{pn}fact" }
  },
  onStart: async function ({ message }) {
    const facts = [
      "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible.",
      "Octopuses have three hearts and blue blood.",
      "Bananas are slightly radioactive due to their potassium content.",
      "A group of flamingos is called a flamboyance.",
      "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
      "There are more possible chess games than atoms in the observable universe.",
      "Sharks are older than trees — they've been around for 450 million years.",
      "A day on Venus is longer than a year on Venus.",
      "Crows can recognize human faces and hold grudges for years.",
      "Wombat poop is cube-shaped — the only animal that produces cubic scat.",
      "The dot over a lowercase 'i' is called a tittle.",
      "A snail can sleep for 3 years at a time.",
      "Hot water freezes faster than cold water — this is called the Mpemba effect.",
      "Butterflies taste with their feet.",
      "The human brain generates about 70,000 thoughts per day."
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    message.reply(`🧠 FUN FACT\n━━━━━━━━━━━━\n${fact}`);
  }
};
