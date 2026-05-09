module.exports = {
  config: {
    name: "ban",
    aliases: ["block"],
    description: "Ban a user from using the bot",
    usage: "ban @mention [reason]",
    cooldown: 3,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db, config }) => {
    const mentioned = event.mentions && Object.keys(event.mentions);
    if (!mentioned || !mentioned.length) return api.sendMessage(`⛔ Usage: ${config.prefix}ban @user [reason]`, event.threadID);
    const targetUID = mentioned[0];
    if (config.adminBot.includes(targetUID)) return api.sendMessage("❌ Cannot ban an admin!", event.threadID);
    const reason = args.slice(1).join(" ") || "No reason provided";
    db.banUser(targetUID);
    api.sendMessage(`🚫 User ${targetUID} has been BANNED\nReason: ${reason}`, event.threadID);
  }
};
