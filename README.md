# 🐄 COW BOT

A fully-featured Facebook Messenger bot based on GoatBot V2, rebranded as **COW BOT** with all original commands plus merged economy/fun commands.

## Features
- 100+ commands across categories: AI, economy, games, media, tools, fun, group management
- SQLite database (no setup required)
- Built-in web dashboard + uptime monitoring
- Auto-reconnect when Facebook session expires
- Spam protection, anti-abuse

## Prefix
`!` (configurable in `config.json`)

## Bot UID
`61576783743431`

## Quick Deploy

### Render (recommended)
1. Fork/push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect repo
3. Everything auto-configures from `render.yaml` — no manual env vars needed
4. After deploy, your uptime URL is: `https://your-app.onrender.com`

### Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Everything auto-configures from `railway.toml` + `nixpacks.toml`
3. After deploy, go to Settings → Networking → Generate Domain

## Config
Edit `config.json` to change:
- `prefix` — default `!`
- `adminBot` — add your UID
- `timeZone` — default Asia/Manila

## Appstate
Place your Facebook cookies in `appstate.json` (already set).

## Commands
Send `!help` to the bot to see all available commands.

## Credits
Original GoatBot V2 by [NTKhang](https://github.com/ntkhang03/Goat-Bot-V2) — heavily modified as Cow Bot.
