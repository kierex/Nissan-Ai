module.exports = {
  config: {
    name: "broadcast",
    aliases: ["bc", "announce"],
    description: "Broadcast a message to all threads",
    usage: "broadcast <message>",
    cooldown: 10,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db }) => {
    const msg = args.join(" ");
    if (!msg) return api.sendMessage("❌ Provide a message to broadcast.", event.threadID);
    const threads = db.prepare("SELECT tid FROM threads").all();
    let sent = 0;
    for (const t of threads) {
      try {
        await new Promise((res, rej) => api.sendMessage(`📢 ANNOUNCEMENT\n━━━━━━━━━━━━━\n${msg}`, t.tid, (e) => e ? rej(e) : res()));
        sent++;
        await new Promise(r => setTimeout(r, 300));
      } catch {}
    }
    api.sendMessage(`✅ Broadcast sent to ${sent}/${threads.length} threads.`, event.threadID);
  }
};
