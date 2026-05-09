const truths = [
  "What is your biggest fear?",
  "What is the most embarrassing thing that happened to you?",
  "Have you ever lied to your best friend?",
  "What is your biggest secret?",
  "Who do you have a crush on?",
  "What is the worst thing you've ever done?",
  "Have you ever cheated on a test?",
  "What is your most embarrassing memory?",
  "What is something you've never told anyone?",
  "What do you think about when you can't sleep?",
  "Have you ever stolen something?",
  "What is your biggest regret?",
  "Who do you trust the most?",
  "What is a bad habit you have?",
  "What would you do with a million dollars?"
];
const dares = [
  "Send a voice message saying 'I love [first person in your contact list]'",
  "Change your profile picture to a funny face for 1 hour",
  "Send the last photo in your gallery to this group",
  "Type with your elbows for the next 3 messages",
  "Tell a joke and end it with 'boing boing'",
  "Send a message to someone you haven't talked to in months",
  "Do 20 pushups and send a selfie as proof",
  "Let the person next to you send any message from your phone",
  "Speak in rhymes for the next 5 minutes",
  "Sing a song and record a voice message",
  "Write 5 nice things about the last person who replied",
  "Send a heart emoji to 5 random people in your contacts",
  "Talk like a robot for the next 10 minutes",
  "Change your name in this chat to 'I am a potato' for 30 minutes",
  "Send the most embarrassing photo you have of yourself"
];

module.exports = {
  config: {
    name: "truth",
    aliases: ["dare", "tod", "truthordare"],
    description: "Truth or Dare game",
    usage: "truth | dare | tod",
    cooldown: 5,
    category: "fun"
  },
  run: async ({ api, event, args, config }) => {
    const cmd = (event.body || "").slice(config.prefix.length).trim().split(/\s+/)[0].toLowerCase();
    if (cmd === "dare") {
      const dare = dares[Math.floor(Math.random() * dares.length)];
      return api.sendMessage(`🔥 DARE!\n━━━━━━━━━━━━━━\n${dare}\n\nDo you dare? 😈`, event.threadID);
    }
    if (cmd === "tod") {
      const pick = Math.random() < 0.5;
      const chosen = pick ? truths[Math.floor(Math.random() * truths.length)] : dares[Math.floor(Math.random() * dares.length)];
      return api.sendMessage(`${pick ? "💬 TRUTH!" : "🔥 DARE!"}\n━━━━━━━━━━━━━\n${chosen}`, event.threadID);
    }
    const truth = truths[Math.floor(Math.random() * truths.length)];
    api.sendMessage(`💬 TRUTH!\n━━━━━━━━━━━━━━\n${truth}\n\nAnswer honestly! 😇`, event.threadID);
  }
};
