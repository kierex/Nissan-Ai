module.exports = {
  config: { name: "trackStats", description: "Track message stats and update user activity" },
  run: async ({ api, event, db }) => {
    if (event.type !== "message" && event.type !== "message_reply") return;
    if (event.senderID === api.getCurrentUserID()) return;
    db.incrementStat("total_messages");
    try {
      const user = db.getUser(event.senderID);
      db.prepare("UPDATE users SET total_messages = total_messages + 1, last_seen = ? WHERE uid = ?")
        .run(new Date().toISOString(), event.senderID);
      db.getThread(event.threadID);
      if (event.body && event.body.startsWith(global.config?.prefix || "!")) {
        db.incrementStat("total_commands");
      }
    } catch {}
  }
};
