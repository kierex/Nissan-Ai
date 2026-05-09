module.exports = {
  config: { name: "welcome", description: "Welcome new members" },
  run: async ({ api, event, db, config }) => {
    if (event.type !== "event") return;
    if (event.logMessageType === "log:subscribe") {
      const thread = db.getThread(event.threadID);
      if (!thread.welcome_msg) return;
      const added = event.logMessageData?.addedParticipants || [];
      for (const p of added) {
        if (p.userFbId === api.getCurrentUserID()) continue;
        const name = p.fullName || "Friend";
        db.getUser(p.userFbId, name);
        api.sendMessage(
          `👋 Welcome to the group, ${name}!\n\n` +
          `🤖 I'm NAV BOT — your friendly assistant!\n` +
          `📌 Prefix: ${config.prefix}\n` +
          `📖 Type ${config.prefix}help to see commands\n` +
          `✅ Register with ${config.prefix}register <name>\n\n` +
          `Enjoy your stay! 🎉`,
          event.threadID
        );
      }
    }

    if (event.logMessageType === "log:unsubscribe") {
      const thread = db.getThread(event.threadID);
      if (!thread.antiout) return;
      const leftUID = event.logMessageData?.leftParticipantFbId;
      if (leftUID && leftUID !== api.getCurrentUserID()) {
        const user = db.getUser(leftUID);
        api.sendMessage(`👋 ${user.name || "A member"} has left the group. Goodbye! 😢`, event.threadID);
      }
    }
  }
};
