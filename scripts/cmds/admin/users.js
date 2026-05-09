"use strict";
module.exports = {
  config: {
    name: "users",
    aliases: ["userlist", "allusers", "userinfo"],
    description: "View all users with UIDs, balances, and stats. Customize amounts.",
    usage: "users [page] | users set <uid> <balance> | users reset <uid> | users info <uid>",
    cooldown: 3,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, db, config }) => {
    const sub = (args[0] || "").toLowerCase();

    // users set <uid> <amount>
    if (sub === "set" || sub === "setbal") {
      const uid    = args[1];
      const amount = parseInt(args[2]);
      if (!uid || isNaN(amount)) return api.sendMessage(`Usage: ${config.prefix}users set <uid> <amount>`, event.threadID);
      if (amount < 0) return api.sendMessage("❌ Amount must be 0 or more!", event.threadID);
      db.getUser(uid);
      db.setBalance(uid, amount);
      const u = db.prepare("SELECT name FROM users WHERE uid = ?").get(uid);
      return api.sendMessage(
        `✅ Balance Updated\n${"─".repeat(22)}\n` +
        `👤 User: ${u ? u.name : uid}\n` +
        `🆔 UID: ${uid}\n` +
        `💰 New Balance: ${config.currency}${amount.toLocaleString()}`,
        event.threadID
      );
    }

    // users addbal <uid> <amount>
    if (sub === "addbal" || sub === "add") {
      const uid    = args[1];
      const amount = parseInt(args[2]);
      if (!uid || isNaN(amount)) return api.sendMessage(`Usage: ${config.prefix}users add <uid> <amount>`, event.threadID);
      db.getUser(uid);
      const newBal = db.updateBalance(uid, amount);
      const u = db.prepare("SELECT name FROM users WHERE uid = ?").get(uid);
      return api.sendMessage(
        `✅ ${amount >= 0 ? "Added" : "Deducted"} Coins\n${"─".repeat(22)}\n` +
        `👤 User: ${u ? u.name : uid}\n` +
        `🆔 UID: ${uid}\n` +
        `${amount >= 0 ? "+" : ""}${config.currency}${amount.toLocaleString()}\n` +
        `💰 New Balance: ${config.currency}${newBal.toLocaleString()}`,
        event.threadID
      );
    }

    // users reset <uid>
    if (sub === "reset") {
      const uid = args[1];
      if (!uid) return api.sendMessage(`Usage: ${config.prefix}users reset <uid>`, event.threadID);
      db.getUser(uid);
      db.setBalance(uid, 500);
      db.prepare("UPDATE users SET exp=0, level=1, wins=0, losses=0, games_played=0, daily_streak=0 WHERE uid=?").run(uid);
      const u = db.prepare("SELECT name FROM users WHERE uid=?").get(uid);
      return api.sendMessage(`✅ Reset ${u ? u.name : uid} (${uid}) to default stats.`, event.threadID);
    }

    // users info <uid>
    if (sub === "info") {
      const uid = args[1];
      if (!uid) return api.sendMessage(`Usage: ${config.prefix}users info <uid>`, event.threadID);
      const u   = db.getUser(uid);
      const eco = db.getBalance(uid);
      const inv = db.getInventory(uid);
      // Check active games
      let gameInfo = "None";
      try {
        const gs = db.prepare("SELECT game, data FROM game_sessions WHERE uid=? ORDER BY created_at DESC LIMIT 1").get(uid);
        if (gs) gameInfo = `${gs.game} (active)`;
      } catch {}

      return api.sendMessage(
        `👤 USER INFO\n${"─".repeat(28)}\n` +
        `🆔 UID: ${uid}\n` +
        `📛 Name: ${u.name || "Unknown"}\n` +
        `✅ Registered: ${u.registered ? "Yes" : "No"}\n` +
        `🚫 Banned: ${u.banned ? "Yes" : "No"}\n` +
        `💰 Balance: ${config.currency}${eco.balance.toLocaleString()}\n` +
        `🏦 Bank: ${config.currency}${eco.bank.toLocaleString()}\n` +
        `⭐ Level: ${u.level} (${u.exp} XP)\n` +
        `🏆 Wins: ${u.wins} | Losses: ${u.losses}\n` +
        `🎮 Games: ${u.games_played}\n` +
        `🔥 Streak: ${u.daily_streak} days\n` +
        `🎒 Items: ${inv.length}\n` +
        `🎯 In Game: ${gameInfo}\n` +
        `📅 Joined: ${u.joined_at || "Unknown"}`,
        event.threadID
      );
    }

    // users ban <uid>
    if (sub === "ban") {
      const uid = args[1];
      if (!uid) return api.sendMessage(`Usage: ${config.prefix}users ban <uid>`, event.threadID);
      db.banUser(uid);
      return api.sendMessage(`🚫 Banned UID: ${uid}`, event.threadID);
    }

    // users unban <uid>
    if (sub === "unban") {
      const uid = args[1];
      if (!uid) return api.sendMessage(`Usage: ${config.prefix}users unban <uid>`, event.threadID);
      db.unbanUser(uid);
      return api.sendMessage(`✅ Unbanned UID: ${uid}`, event.threadID);
    }

    // Default: list all users (paginated)
    const page   = Math.max(1, parseInt(sub) || 1);
    const limit  = 10;
    const offset = (page - 1) * limit;

    const total = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const users = db.prepare(`
      SELECT u.uid, u.name, u.registered, u.banned, u.level, u.wins, u.games_played, e.balance
      FROM users u LEFT JOIN economy e ON u.uid = e.uid
      ORDER BY e.balance DESC LIMIT ? OFFSET ?
    `).all(limit, offset);

    if (!users.length) return api.sendMessage(`📋 No users found (page ${page}).`, event.threadID);

    const totalPages = Math.ceil(total / limit);
    let msg = `👥 ALL USERS (${total} total) — Page ${page}/${totalPages}\n${"═".repeat(32)}\n`;
    users.forEach((u, i) => {
      const rank  = offset + i + 1;
      const flags = [u.registered ? "✅" : "⬜", u.banned ? "🚫" : ""].filter(Boolean).join("");
      msg += `${rank}. ${flags} ${u.name || "Unknown"}\n`;
      msg += `   🆔 ${u.uid}\n`;
      msg += `   💰 ${config.currency}${(u.balance || 0).toLocaleString()} | ⭐Lv${u.level} | 🏆${u.wins}W\n`;
    });
    msg += `${"─".repeat(32)}\n`;
    msg += `📌 ${config.prefix}users info <uid> — detail\n`;
    msg += `💰 ${config.prefix}users set <uid> <amount>\n`;
    msg += `➕ ${config.prefix}users add <uid> <amount>\n`;
    msg += `🔄 ${config.prefix}users reset <uid>\n`;
    if (totalPages > 1) msg += `📄 ${config.prefix}users ${page + 1} — next page`;

    api.sendMessage(msg, event.threadID);
  }
};
