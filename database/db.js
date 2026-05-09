"use strict";
  const Database = require("better-sqlite3");
  const path = require("path");
  const fs = require("fs");

  let chalk;
  try { chalk = require("chalk"); } catch { chalk = { green: s => s, red: s => s, yellow: s => s }; }

  const dbPath = path.join(__dirname, "navbot.db");

  let db;
  let dbReady = false;

  try {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    dbReady = true;
  } catch (e) {
    console.error("[DB] FATAL: Could not open database:", e.message);
    // Stub so the app can still start and /ping responds
    const stubStmt = { get: () => null, all: () => [], run: () => ({ changes: 0 }) };
    db = {
      prepare: () => stubStmt,
      exec: () => {},
      pragma: () => {},
      transaction: (fn) => fn
    };
  }

  function initialize() {
    if (!dbReady) { console.error("[DB] Skipping initialize — DB not ready"); return; }
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          uid TEXT PRIMARY KEY,
          name TEXT DEFAULT 'Unknown',
          registered INTEGER DEFAULT 0,
          banned INTEGER DEFAULT 0,
          balance INTEGER DEFAULT 500,
          exp INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          total_messages INTEGER DEFAULT 0,
          daily_streak INTEGER DEFAULT 0,
          last_daily TEXT DEFAULT NULL,
          last_seen TEXT DEFAULT NULL,
          joined_at TEXT DEFAULT (datetime('now')),
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          games_played INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS threads (
          tid TEXT PRIMARY KEY,
          name TEXT DEFAULT 'Unknown',
          prefix TEXT DEFAULT NULL,
          welcome_msg INTEGER DEFAULT 1,
          antiout INTEGER DEFAULT 1,
          joined_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS economy (
          uid TEXT PRIMARY KEY,
          balance INTEGER DEFAULT 500,
          bank INTEGER DEFAULT 0,
          total_earned INTEGER DEFAULT 0,
          total_spent INTEGER DEFAULT 0,
          FOREIGN KEY (uid) REFERENCES users(uid)
        );
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uid TEXT NOT NULL,
          item TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          acquired_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (uid) REFERENCES users(uid)
        );
        CREATE TABLE IF NOT EXISTS game_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uid TEXT NOT NULL,
          thread_id TEXT NOT NULL,
          game TEXT NOT NULL,
          data TEXT DEFAULT '{}',
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(uid, game)
        );
        CREATE TABLE IF NOT EXISTS custom_commands (
          name TEXT PRIMARY KEY,
          type TEXT DEFAULT 'text',
          content TEXT NOT NULL,
          added_by TEXT,
          added_at TEXT DEFAULT (datetime('now')),
          use_count INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS leaderboard (
          uid TEXT PRIMARY KEY,
          name TEXT,
          balance INTEGER DEFAULT 0,
          exp INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS bot_stats (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      const insertStat = db.prepare("INSERT OR IGNORE INTO bot_stats (key, value) VALUES (?, ?)");
      insertStat.run("total_commands", "0");
      insertStat.run("total_messages", "0");
      insertStat.run("start_time", new Date().toISOString());
      insertStat.run("bot_version", "1.0.0");

      console.log(chalk.green("✓ Database initialized"));
    } catch (e) {
      console.error("[DB] initialize error:", e.message);
    }
  }

  function getUser(uid, name = "Unknown") {
    try {
      let user = db.prepare("SELECT * FROM users WHERE uid = ?").get(uid);
      if (!user) {
        db.prepare("INSERT OR IGNORE INTO users (uid, name) VALUES (?, ?)").run(uid, name);
        db.prepare("INSERT OR IGNORE INTO economy (uid, balance) VALUES (?, 500)").run(uid);
        user = db.prepare("SELECT * FROM users WHERE uid = ?").get(uid);
      }
      return user || { uid, name, balance: 500, exp: 0, level: 1, wins: 0, losses: 0, registered: 0, banned: 0 };
    } catch { return { uid, name, balance: 500, exp: 0, level: 1, wins: 0, losses: 0, registered: 0, banned: 0 }; }
  }

  function updateUser(uid, updates) {
    try {
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
      const values = [...Object.values(updates), uid];
      db.prepare(`UPDATE users SET ${fields} WHERE uid = ?`).run(...values);
    } catch {}
  }

  function getBalance(uid) {
    try {
      const eco = db.prepare("SELECT balance, bank FROM economy WHERE uid = ?").get(uid);
      if (!eco) {
        db.prepare("INSERT OR IGNORE INTO economy (uid, balance) VALUES (?, 500)").run(uid);
        return { balance: 500, bank: 0 };
      }
      return eco;
    } catch { return { balance: 500, bank: 0 }; }
  }

  function updateBalance(uid, amount) {
    try {
      const eco = getBalance(uid);
      const newBalance = Math.max(0, eco.balance + amount);
      db.prepare("UPDATE economy SET balance = ? WHERE uid = ?").run(newBalance, uid);
      return newBalance;
    } catch { return 0; }
  }

  function setBalance(uid, amount) {
    try {
      db.prepare("INSERT OR REPLACE INTO economy (uid, balance) VALUES (?, ?)").run(uid, Math.max(0, amount));
    } catch {}
    return Math.max(0, amount);
  }

  function getThread(tid) {
    try {
      let thread = db.prepare("SELECT * FROM threads WHERE tid = ?").get(tid);
      if (!thread) {
        db.prepare("INSERT OR IGNORE INTO threads (tid) VALUES (?)").run(tid);
        thread = db.prepare("SELECT * FROM threads WHERE tid = ?").get(tid);
      }
      return thread || { tid, prefix: null, welcome_msg: 1, antiout: 1 };
    } catch { return { tid, prefix: null, welcome_msg: 1, antiout: 1 }; }
  }

  function addExp(uid, amount) {
    try {
      const user = getUser(uid);
      const newExp = (user.exp || 0) + amount;
      const newLevel = Math.floor(Math.sqrt(newExp / 100)) + 1;
      db.prepare("UPDATE users SET exp = ?, level = ? WHERE uid = ?").run(newExp, newLevel, uid);
      return { exp: newExp, level: newLevel, leveledUp: newLevel > (user.level || 1) };
    } catch { return { exp: 0, level: 1, leveledUp: false }; }
  }

  function getLeaderboard(type = "balance", limit = 10) {
    try {
      if (type === "balance") {
        return db.prepare(`SELECT u.uid, u.name, e.balance FROM users u JOIN economy e ON u.uid = e.uid WHERE u.banned = 0 ORDER BY e.balance DESC LIMIT ?`).all(limit);
      } else if (type === "exp") {
        return db.prepare(`SELECT uid, name, exp, level FROM users WHERE banned = 0 ORDER BY exp DESC LIMIT ?`).all(limit);
      } else if (type === "wins") {
        return db.prepare(`SELECT uid, name, wins, games_played FROM users WHERE banned = 0 ORDER BY wins DESC LIMIT ?`).all(limit);
      }
    } catch { return []; }
    return [];
  }

  function getStat(key) {
    try {
      const row = db.prepare("SELECT value FROM bot_stats WHERE key = ?").get(key);
      return row ? row.value : null;
    } catch { return null; }
  }

  function setStat(key, value) {
    try { db.prepare("INSERT OR REPLACE INTO bot_stats (key, value) VALUES (?, ?)").run(key, value.toString()); } catch {}
  }

  function incrementStat(key) {
    try {
      const current = parseInt(getStat(key) || "0");
      setStat(key, current + 1);
    } catch {}
  }

  function registerUser(uid, name) {
    try { db.prepare("UPDATE users SET registered = 1, name = ? WHERE uid = ?").run(name, uid); } catch {}
  }

  function getAllUsers() {
    try { return db.prepare("SELECT * FROM users").all(); } catch { return []; }
  }

  function banUser(uid) {
    try { db.prepare("UPDATE users SET banned = 1 WHERE uid = ?").run(uid); } catch {}
  }

  function unbanUser(uid) {
    try { db.prepare("UPDATE users SET banned = 0 WHERE uid = ?").run(uid); } catch {}
  }

  function addInventoryItem(uid, item, quantity = 1) {
    try {
      const existing = db.prepare("SELECT * FROM inventory WHERE uid = ? AND item = ?").get(uid, item);
      if (existing) {
        db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE uid = ? AND item = ?").run(quantity, uid, item);
      } else {
        db.prepare("INSERT INTO inventory (uid, item, quantity) VALUES (?, ?, ?)").run(uid, item, quantity);
      }
    } catch {}
  }

  function getInventory(uid) {
    try { return db.prepare("SELECT * FROM inventory WHERE uid = ?").all(uid); } catch { return []; }
  }

  module.exports = {
    db,
    dbReady,
    initialize,
    getUser,
    updateUser,
    getBalance,
    updateBalance,
    setBalance,
    getThread,
    addExp,
    getLeaderboard,
    getStat,
    setStat,
    incrementStat,
    registerUser,
    getAllUsers,
    banUser,
    unbanUser,
    addInventoryItem,
    getInventory,
    prepare: (...args) => db.prepare(...args)
  };
  