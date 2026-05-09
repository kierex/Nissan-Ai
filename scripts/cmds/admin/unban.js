module.exports = {
  config: {
    name: "unban",
    aliases: ["unblock"],
    description: "Unban a user",
    usage: "unban <uid>",
    cooldown: 3,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = args[0];
    if (!uid) return api.sendMessage(`✅ Usage: ${config.prefix}unban <uid>`, event.threadID);
    db.unbanUser(uid);
    api.sendMessage(`✅ User ${uid} has been unbanned.`, event.threadID);
  }
};
