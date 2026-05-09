# 🤖 NAV BOT

A powerful Facebook Messenger bot inspired by GoatBot — economy, games, custom commands, web dashboard, and one-click deploy to Render/Railway/Replit.

---

## ✨ Features

- 💬 **Dual FCA Loader** — Uses `fca-unofficial` (npm) first; falls back to bundled `./fca` automatically
- 💰 **Economy System** — Balance, bank, daily rewards, transfers, shop, mining, fishing, rob
- 🎮 **15+ Games** — Blackjack, Slots, TicTacToe, Dice, Flip, RPS, Hangman, Word, Quiz, Connect4, Snake, Memory, Race, Riddle, High-Low, Number Guess, Lottery
- 🏆 **Leaderboards** — Balance, EXP, Wins rankings (real-time)
- 🛡️ **Admin Commands** — Ban/Unban, Broadcast, AddCoins, SetPrefix, **AddCmd, RemoveCmd, Users panel**
- ➕ **Dynamic Custom Commands** — Add/remove commands live from chat, saved permanently in DB
- 👥 **User UID Panel** — View all users, UIDs, set/customize balance, reset stats, ban from chat
- 🎯 **Game Session DB** — Active game detection persists across restarts
- 🌐 **Web Dashboard** — Real-time stats, leaderboard, command list, uptime bar
- 📡 **Uptime Endpoints** — `/ping` `/health` `/status` for UptimeRobot/BetterStack
- 📊 **SQLite Database** — All data persisted in `navbot.db`
- 🚀 **Zero-config Deploy** — Render, Railway, Replit — no env vars needed

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/afk2027/NEX-BOT.git
cd NEX-BOT
npm install
```

### 2. Add Your Facebook Cookies
Edit `appstate.json` — paste your Facebook cookies (must include `c_user`, `xs`, `fr`, `datr`, `sb`).

Get cookies with the **c3c-fbstate** browser extension or from browser DevTools → Application → Cookies → facebook.com.

> ⚠️ Domain must be `.facebook.com` (with the dot prefix)

### 3. Configure
Edit `config.json`:
```json
{
  "prefix": "!",
  "adminBot": ["YOUR_FACEBOOK_UID"],
  "botName": "NAV BOT"
}
```

### 4. Run
```bash
npm start
```

---

## 🌐 Deploy to Render (Free)

1. Fork/push this repo to your GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect repo → Render auto-reads `render.yaml`
4. Click **Deploy** — no env vars needed!
5. Your URL: `https://nav-bot-xxxx.onrender.com`

**Keep alive with UptimeRobot (prevents Render free tier sleeping):**
- URL: `https://nav-bot-xxxx.onrender.com/ping`
- Type: HTTP(s) | Interval: 5 min | Expected: 200

---

## 🚂 Deploy to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → Deploy from GitHub
2. Select this repo — Railway auto-reads `railway.json` + `nixpacks.toml`
3. Click **Deploy** — no env vars needed!

---

## 💻 Deploy to Replit

1. Import this GitHub repo into Replit
2. `.replit` file is pre-configured — just click **Run**

---

## 📁 Structure

```
NAV BOT/
├── index.js              ← Main entry — loads fca-unofficial, cmds, events
├── config.json           ← Bot settings (prefix, admin UID, botName)
├── appstate.json         ← Facebook cookies (FILL THIS IN)
├── package.json
├── render.yaml           ← Render auto-deploy config
├── railway.json          ← Railway auto-deploy config
├── nixpacks.toml         ← Nixpacks build config (Railway/Render)
├── .replit               ← Replit run config
├── Procfile              ← Heroku/Render process file
├── fca/                  ← Bundled facebook-chat-api source (fallback)
│   ├── index.js
│   ├── utils.js
│   └── src/              ← 42 API method files
├── database/
│   └── db.js             ← SQLite manager (users, economy, inventory, custom cmds, game sessions)
├── scripts/
│   ├── cmds/             ← 45 command files
│   │   └── admin/        ← Admin-only: addcmd, removecmd, users, ban, addcoins...
│   └── events/           ← autoReact, welcome, trackStats
└── web/
    └── server.js         ← Express dashboard (/, /ping, /health, /api/stats)
```

---

## 📖 Commands

### 💰 Economy
| Command | Description |
|---|---|
| `!register <name>` | Register account |
| `!balance` | Check balance |
| `!daily` | Daily coins + streak bonus |
| `!work` | Work for coins |
| `!mine` | Mine coins |
| `!fish` | Fish for coins |
| `!transfer @user <amount>` | Send coins |
| `!rob @user` | Rob someone |
| `!bank deposit/withdraw <amount>` | Bank management |
| `!shop` | Buy items |
| `!inventory` | View items |
| `!streak` | Daily streak info |
| `!lottery <tickets>` | Buy lottery tickets |

### 🎮 Games
| Command | Description |
|---|---|
| `!dice <bet>` | Roll dice |
| `!flip <bet> heads/tails` | Coin flip |
| `!blackjack <bet>` | Blackjack |
| `!slots <bet>` | Slot machine |
| `!rps <choice> [bet]` | Rock Paper Scissors |
| `!tictactoe [bet]` | Tic-Tac-Toe vs bot |
| `!connect4 [bet]` | Connect 4 vs bot |
| `!snake [amount]` | Snake direction game |
| `!memory [amount]` | Emoji memory game |
| `!race <1-4> <amount>` | Horse race (2x–5x odds) |
| `!highlow <amount> h/l` | Higher or lower card |
| `!riddle [amount]` | Solve riddles |
| `!hangman [bet]` | Hangman |
| `!quiz [bet]` | Trivia |
| `!word [bet]` | Word unscramble |
| `!numberguess [bet]` | Guess the number |
| `!math [bet]` | Math challenge |

### 🎉 Fun
| Command | Description |
|---|---|
| `!truth` | Truth question |
| `!dare` | Dare challenge |
| `!tod` | Random truth or dare |
| `!8ball <question>` | Magic 8-ball |
| `!joke` | Random joke |
| `!quote` | Inspiring quote |
| `!fact` | Fun fact |
| `!love @user1 @user2` | Love meter |
| `!wyr` | Would you rather |
| `!horoscope <sign>` | Horoscope |

### ℹ️ Info
| Command | Description |
|---|---|
| `!help [cmd]` | All commands |
| `!profile` | View profile |
| `!leaderboard [type]` | Rankings |
| `!uptime` | Bot stats |
| `!uid` | Get your UID |
| `!ping` | Response time |

### 👑 Admin Only
| Command | Description |
|---|---|
| `!addcmd <name> \| <response>` | Add custom command (saved to DB) |
| `!addcmd <name> \| --eval <code>` | Add code command |
| `!removecmd <name>` | Remove custom command |
| `!removecmd` | List all custom commands |
| `!users [page]` | List all users with UIDs |
| `!users info <uid>` | Full user info + game status |
| `!users set <uid> <amount>` | Set user balance |
| `!users add <uid> <amount>` | Add/deduct coins |
| `!users reset <uid>` | Reset user to defaults |
| `!users ban <uid>` | Ban user |
| `!users unban <uid>` | Unban user |
| `!addcoins @user <amount>` | Give coins |
| `!ban @user` | Ban user |
| `!unban <uid>` | Unban user |
| `!broadcast <msg>` | Message all threads |
| `!setprefix <prefix>` | Change prefix |

---

## ➕ Custom Commands (addcmd)

Add instant text-response commands that work permanently:
```
!addcmd hi | Hello {sender}! Welcome to the chat 👋
!addcmd rules | 1. Be nice  2. No spam  3. Have fun!
!addcmd time | --eval api.sendMessage('🕐 ' + new Date().toLocaleString(), event.threadID)
```

**Variables:** `{sender}` `{uid}` `{prefix}` `{botname}` `{args}` `{time}` `{date}`

Remove with: `!removecmd hi`

---

## 🌐 Web Dashboard & Uptime

| Endpoint | Purpose |
|---|---|
| `/` | Full dashboard (stats, leaderboards, commands) |
| `/ping` | Uptime monitor — returns `{"status":"alive"}` |
| `/health` | Health check — returns `{"status":"ok"}` |
| `/api/stats` | JSON stats (users, commands, leaderboard) |
| `/api/user/:uid` | User data by UID |

---

## 👑 Admin

Facebook: [fb.com/notfound500](https://www.facebook.com/notfound500)

---

> NAV BOT v1.0.0 — Powered by fca-unofficial + bundled ./fca fallback
