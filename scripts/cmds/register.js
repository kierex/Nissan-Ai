module.exports = {
  config: {
    name: "register",
    aliases: ["reg", "signup"],
    description: "Register your account to use bot features",
    usage: "register <name>",
    cooldown: 10,
    category: "economy"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);

    if (user.registered) {
      return api.sendMessage(
        `✅ You are already registered!\n` +
        `👤 Name: ${user.name}\n` +
        `💰 Balance: ${config.currency}${db.getBalance(uid).balance}\n` +
        `⭐ Level: ${user.level} | EXP: ${user.exp}`,
        event.threadID
      );
    }

    const name = args.join(" ").trim() || "Unknown";
    if (!args[0]) {
      return api.sendMessage(
        `📝 REGISTER\n` +
        `━━━━━━━━━━━━\n` +
        `Usage: ${config.prefix}register <your name>\n\n` +
        `Example: ${config.prefix}register John\n\n` +
        `Benefits:\n` +
        `✅ Access economy commands\n` +
        `✅ Play games\n` +
        `✅ Earn daily rewards\n` +
        `✅ Join leaderboards`,
        event.threadID
      );
    }

    if (name.length > 30) return api.sendMessage("❌ Name too long (max 30 chars).", event.threadID);

    db.registerUser(uid, name);
    db.setBalance(uid, config.startBalance || 500);

    api.sendMessage(
      `🎉 REGISTRATION SUCCESSFUL!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Name: ${name}\n` +
      `💰 Starting Balance: ${config.currency}${config.startBalance || 500}\n` +
      `⭐ Level: 1 | EXP: 0\n\n` +
      `🎮 Commands to try:\n` +
      `${config.prefix}daily — Claim daily coins\n` +
      `${config.prefix}balance — Check balance\n` +
      `${config.prefix}profile — View profile\n` +
      `${config.prefix}dice — Play dice game\n\n` +
      `Welcome to NAV BOT! 🤖`,
      event.threadID
    );
  }
};
