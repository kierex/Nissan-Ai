const jobs = [
  { name: "Programmer", pay: [150, 400], msg: "You wrote code and fixed bugs" },
  { name: "Teacher", pay: [100, 300], msg: "You taught students today" },
  { name: "Doctor", pay: [200, 500], msg: "You treated patients" },
  { name: "Chef", pay: [120, 350], msg: "You cooked delicious meals" },
  { name: "Driver", pay: [80, 200], msg: "You delivered packages" },
  { name: "Artist", pay: [100, 450], msg: "You sold your artwork" },
  { name: "Mechanic", pay: [130, 380], msg: "You fixed cars today" },
  { name: "Farmer", pay: [90, 250], msg: "You harvested crops" },
  { name: "Security", pay: [100, 280], msg: "You guarded a building" },
  { name: "YouTuber", pay: [50, 600], msg: "Your video went viral!" }
];

module.exports = {
  config: {
    name: "work",
    aliases: ["job", "earn"],
    description: "Work to earn coins (1 hour cooldown)",
    usage: "work",
    cooldown: 3,
    category: "economy"
  },
  run: async ({ api, event, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const lastWork = db.prepare("SELECT value FROM bot_stats WHERE key = ?").get(`work_${uid}`);
    const cooldownMs = 3600000;
    if (lastWork) {
      const elapsed = Date.now() - parseInt(lastWork.value);
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
        return api.sendMessage(`⏰ Already worked! Come back in ${remaining} minute${remaining !== 1 ? "s" : ""}.`, event.threadID);
      }
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const pay = Math.floor(Math.random() * (job.pay[1] - job.pay[0] + 1)) + job.pay[0];

    db.updateBalance(uid, pay);
    db.addExp(uid, 10);
    db.prepare("INSERT OR REPLACE INTO bot_stats (key, value) VALUES (?, ?)").run(`work_${uid}`, Date.now().toString());

    api.sendMessage(
      `💼 WORK COMPLETE!\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `👔 Job: ${job.name}\n` +
      `📋 Task: ${job.msg}\n` +
      `💰 Earned: ${config.currency}${pay}\n` +
      `💵 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}\n\n` +
      `⏰ Next work in 1 hour`,
      event.threadID
    );
  }
};
