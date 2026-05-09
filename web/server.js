"use strict";

const express = require("express");
const path = require("path");
const db = require("../database/db");
const config = require("../config.json");

const app = express();
let botAPI = null;
const startTime = Date.now();
let botOnline = false;
let server = null;

app.use(express.json());
app.disable("x-powered-by");

// ─── CORS & Cache headers ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// ─── Health / Uptime endpoints (for UptimeRobot / BetterUptime) ─────────────
app.get("/ping",   (req, res) => res.json({ status: "alive",  bot: config.botName, uptime: getUptime(), ts: Date.now() }));
app.get("/health", (req, res) => res.json({ status: "ok",     bot: config.botName, online: botOnline,   uptime: getUptime() }));
app.get("/status", (req, res) => res.json({ status: "online", bot: config.botName, online: botOnline,   uptime: getUptime() }));

// ─── API ─────────────────────────────────────────────────────────────────────
app.get("/api/stats", (req, res) => {
  try {
    const totalUsers      = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const registeredUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE registered = 1").get().c;
    const totalCommands   = parseInt(db.getStat("total_commands") || "0");
    const totalMessages   = parseInt(db.getStat("total_messages") || "0");
    const topBalance      = db.getLeaderboard("balance", 5);
    const topWins         = db.getLeaderboard("wins", 5);
    const topExp          = db.getLeaderboard("exp", 5);
    res.json({
      status: "online", online: botOnline,
      botName: config.botName, version: config.version,
      prefix: config.prefix, uptime: getUptime(),
      totalUsers, registeredUsers, totalCommands, totalMessages,
      topBalance, topWins, topExp,
      startTime: new Date(startTime).toISOString(),
      commandCount: global.commands ? global.commands.size : 0
    });
  } catch (e) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

app.get("/api/leaderboard", (req, res) => {
  const type  = req.query.type  || "balance";
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  try {
    res.json({ success: true, data: db.getLeaderboard(type, limit), type });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.get("/api/user/:uid", (req, res) => {
  try {
    const user = db.getUser(req.params.uid);
    const eco  = db.getBalance(req.params.uid);
    res.json({ success: true, user, economy: eco });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── Dashboard (index.html) ──────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(getDashboardHTML());
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUptime() {
  const ms = Date.now() - startTime;
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s  / 60);
  const h  = Math.floor(m  / 60);
  const d  = Math.floor(h  / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${config.botName} Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0a0e1a;--bg2:#0f1628;--card:#111827;
  --border:#1e2d45;--accent:#00c6ff;--accent2:#0072ff;
  --green:#22c55e;--red:#ef4444;--yellow:#f59e0b;--purple:#a855f7;
  --text:#e2e8f0;--sub:#64748b;
}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
a{color:inherit;text-decoration:none}

/* Header */
.header{
  background:linear-gradient(135deg,var(--bg2) 0%,#0d1f3c 100%);
  border-bottom:1px solid var(--border);
  padding:18px 32px;
  display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:10;backdrop-filter:blur(10px);
}
.header-left{display:flex;align-items:center;gap:12px}
.logo{font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{
  padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:600;
  background:rgba(34,197,94,.15);color:var(--green);border:1px solid rgba(34,197,94,.3);
  display:flex;align-items:center;gap:5px;
}
.dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:blink 1.5s infinite}
@keyframes blink{0%,100%{opacity:1;box-shadow:0 0 6px var(--green)}50%{opacity:.4}}
.prefix-badge{
  padding:4px 10px;border-radius:8px;font-size:.8rem;font-weight:600;
  background:rgba(0,198,255,.1);color:var(--accent);border:1px solid rgba(0,198,255,.2);
}

/* Layout */
.container{max-width:1280px;margin:0 auto;padding:28px 24px}
.section-title{font-size:1rem;font-weight:700;color:var(--sub);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px}

/* Stat cards */
.stats-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
  gap:16px;margin-bottom:28px;
}
.stat-card{
  background:var(--card);border:1px solid var(--border);border-radius:16px;
  padding:22px;transition:all .2s;position:relative;overflow:hidden;
}
.stat-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--accent),var(--accent2));
  border-radius:16px 16px 0 0;
}
.stat-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,198,255,.1)}
.stat-icon{font-size:2rem;margin-bottom:10px}
.stat-label{font-size:.78rem;color:var(--sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.stat-value{font-size:1.8rem;font-weight:800;color:var(--accent)}
.stat-sub{font-size:.75rem;color:var(--sub);margin-top:4px}

/* Two column */
.two-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;margin-bottom:28px}

/* Leaderboard */
.lb-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px}
.lb-card h3{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.lb-item{
  display:flex;align-items:center;gap:12px;
  padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);
}
.lb-item:last-child{border:0}
.lb-rank{
  width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex;align-items:center;justify-content:center;
  font-size:.75rem;font-weight:800;flex-shrink:0;
}
.lb-rank.gold{background:linear-gradient(135deg,#fbbf24,#d97706)}
.lb-rank.silver{background:linear-gradient(135deg,#94a3b8,#64748b)}
.lb-rank.bronze{background:linear-gradient(135deg,#cd7c2f,#a0522d)}
.lb-name{flex:1;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-val{font-size:.9rem;font-weight:700;color:var(--accent);flex-shrink:0}

/* Commands list */
.cmd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:28px}
.cmd-tag{
  background:var(--card);border:1px solid var(--border);border-radius:10px;
  padding:10px 14px;font-size:.82rem;
  display:flex;align-items:center;gap:8px;
  transition:.15s;cursor:default;
}
.cmd-tag:hover{border-color:var(--accent);background:rgba(0,198,255,.05)}
.cmd-tag .cat{font-size:.7rem;color:var(--sub);margin-left:auto}

/* Info bar */
.info-bar{
  background:var(--card);border:1px solid var(--border);border-radius:16px;
  padding:18px 24px;margin-bottom:28px;
  display:flex;flex-wrap:wrap;gap:20px;align-items:center;
}
.info-item{display:flex;align-items:center;gap:8px;font-size:.85rem}
.info-item .key{color:var(--sub)}
.info-item .val{font-weight:600;color:var(--text)}

/* Uptime bar */
.uptime-section{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:28px}
.uptime-bar{
  height:10px;background:rgba(255,255,255,.06);border-radius:5px;overflow:hidden;margin:12px 0 6px;
}
.uptime-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--green));border-radius:5px;transition:width 1s}

/* Footer */
.footer{text-align:center;padding:24px;color:var(--sub);font-size:.8rem;border-top:1px solid var(--border)}
.footer a{color:var(--accent)}

/* Loader */
.loading{color:var(--sub);font-size:.85rem;text-align:center;padding:16px}
.skeleton{background:linear-gradient(90deg,var(--border) 25%,rgba(255,255,255,.03) 50%,var(--border) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;height:20px;border-radius:6px;margin:8px 0}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

@media(max-width:600px){
  .header{padding:14px 16px}
  .container{padding:16px}
  .stat-value{font-size:1.4rem}
}
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="logo">🤖 ${config.botName}</div>
    <div class="badge"><span class="dot"></span> ONLINE</div>
  </div>
  <div style="display:flex;gap:10px;align-items:center">
    <div class="prefix-badge">Prefix: <strong>${config.prefix}</strong></div>
    <div style="font-size:.8rem;color:var(--sub)" id="clock"></div>
  </div>
</div>

<div class="container">

  <!-- Info bar -->
  <div class="info-bar">
    <div class="info-item"><span class="key">Version</span><span class="val" id="ib-ver">v${config.version}</span></div>
    <div class="info-item"><span class="key">Uptime</span><span class="val" id="ib-up">Loading…</span></div>
    <div class="info-item"><span class="key">Commands</span><span class="val" id="ib-cmds">-</span></div>
    <div class="info-item"><span class="key">Registered Users</span><span class="val" id="ib-reg">-</span></div>
    <div class="info-item"><span class="key">Currency</span><span class="val">💰 Coins</span></div>
    <div class="info-item"><span class="key">Admin</span><span class="val">${config.adminBot[0]}</span></div>
  </div>

  <!-- Stats -->
  <p class="section-title">Overview</p>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Users</div><div class="stat-value" id="s-users">-</div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Registered</div><div class="stat-value" id="s-reg">-</div></div>
    <div class="stat-card"><div class="stat-icon">⚡</div><div class="stat-label">Commands Used</div><div class="stat-value" id="s-cmds">-</div></div>
    <div class="stat-card"><div class="stat-icon">💬</div><div class="stat-label">Messages</div><div class="stat-value" id="s-msgs">-</div></div>
    <div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-label">Uptime</div><div class="stat-value" id="s-up">-</div><div class="stat-sub" id="s-since">-</div></div>
    <div class="stat-card"><div class="stat-icon">🎮</div><div class="stat-label">Bot Status</div><div class="stat-value" style="color:var(--green);font-size:1.2rem">● LIVE</div></div>
  </div>

  <!-- Leaderboards -->
  <p class="section-title">Leaderboards</p>
  <div class="two-col">
    <div class="lb-card">
      <h3>💰 Top Balance</h3>
      <div id="lb-bal"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
    </div>
    <div class="lb-card">
      <h3>🏆 Top Wins</h3>
      <div id="lb-wins"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
    </div>
  </div>

  <!-- Commands -->
  <p class="section-title">Available Commands (${config.prefix}help)</p>
  <div class="cmd-grid" id="cmd-list">
    ${[
      ['help','📋','info'],['register','📝','account'],['profile','👤','account'],
      ['balance','💰','economy'],['daily','🎁','economy'],['work','⚒️','economy'],
      ['bank','🏦','economy'],['transfer','💸','economy'],['leaderboard','🏆','rank'],
      ['slots','🎰','games'],['flip','🪙','games'],['dice','🎲','games'],
      ['rps','✊','games'],['blackjack','🃏','games'],['highlow','🎴','games'],
      ['tictactoe','✖️','games'],['hangman','📝','games'],['connect4','🔴','games'],
      ['snake','🐍','games'],['memory','🧠','games'],['race','🏇','games'],
      ['riddle','🧩','games'],['numberguess','🔢','games'],['quiz','❓','games'],
      ['word','🔤','games'],['truth','💬','fun'],['dare','🔥','fun'],
      ['8ball','🎱','fun'],['joke','😂','fun'],['quote','💡','fun'],
      ['horoscope','♈','fun'],['love','💕','fun'],['wyr','🤔','fun'],
      ['fish','🎣','economy'],['coinmine','⛏️','economy'],['rob','🦹','economy'],
      ['shop','🛒','economy'],['inventory','🎒','economy'],['lottery','🎟️','economy'],
      ['ping','🏓','info'],['uptime','⏱️','info'],['uid','🆔','info'],
      ['streak','🔥','economy'],['fact','📚','fun'],
    ].map(([n,e,c]) => `<div class="cmd-tag">${e} <strong>${config.prefix}${n}</strong><span class="cat">${c}</span></div>`).join('')}
  </div>

  <!-- Uptime section -->
  <p class="section-title">Uptime Monitor</p>
  <div class="uptime-section">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:600">Server Uptime</span>
      <span id="up-pct" style="color:var(--green);font-weight:700">100%</span>
    </div>
    <div class="uptime-bar"><div class="uptime-fill" id="up-bar" style="width:100%"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--sub)">
      <span>Started: <span id="up-start">-</span></span>
      <span>Running: <span id="up-run">-</span></span>
    </div>
    <div style="margin-top:14px;padding:12px;background:rgba(0,198,255,.06);border:1px solid rgba(0,198,255,.15);border-radius:10px;font-size:.82rem">
      📡 <strong>UptimeRobot URL:</strong> <code id="ping-url" style="color:var(--accent)">https://&lt;your-render-url&gt;/ping</code>
      <br/><span style="color:var(--sub);margin-top:4px;display:block">Set monitor type: HTTP(s) | Interval: 5 minutes | Expected: 200</span>
    </div>
  </div>

</div>

<div class="footer">
  🤖 ${config.botName} v${config.version} &bull; Powered by <a href="https://www.npmjs.com/package/fca-unofficial">fca-unofficial</a> &bull; Built for Facebook Messenger
</div>

<script>
(function(){
  // Clock
  function tick(){
    const d=new Date();
    document.getElementById('clock').textContent=d.toLocaleTimeString();
  }
  tick(); setInterval(tick,1000);

  // Uptime URL
  document.getElementById('ping-url').textContent=location.origin+'/ping';

  // Rank icons
  const ranks=['🥇','🥈','🥉','4️⃣','5️⃣'];
  const cls=['gold','silver','bronze','',''];

  function lbHTML(data, valFn){
    if(!data||!data.length) return '<div class="loading">No data yet</div>';
    return data.map((u,i)=>
      \`<div class="lb-item">
        <div class="lb-rank \${cls[i]||''}">\${ranks[i]||i+1}</div>
        <div class="lb-name">\${u.name||'Unknown'}</div>
        <div class="lb-val">\${valFn(u)}</div>
      </div>\`
    ).join('');
  }

  function num(n){ return (n||0).toLocaleString(); }

  async function load(){
    try{
      const r=await fetch('/api/stats');
      const d=await r.json();

      document.getElementById('s-users').textContent=num(d.totalUsers);
      document.getElementById('s-reg').textContent=num(d.registeredUsers);
      document.getElementById('s-cmds').textContent=num(d.totalCommands);
      document.getElementById('s-msgs').textContent=num(d.totalMessages);
      document.getElementById('s-up').textContent=d.uptime||'-';
      document.getElementById('ib-up').textContent=d.uptime||'-';
      document.getElementById('ib-cmds').textContent=(d.commandCount||0)+' cmds';
      document.getElementById('ib-reg').textContent=num(d.registeredUsers);

      const since=new Date(d.startTime);
      document.getElementById('s-since').textContent='Since '+since.toLocaleDateString();
      document.getElementById('up-start').textContent=since.toLocaleString();
      document.getElementById('up-run').textContent=d.uptime;

      document.getElementById('lb-bal').innerHTML=lbHTML(d.topBalance,u=>'💰'+num(u.balance));
      document.getElementById('lb-wins').innerHTML=lbHTML(d.topWins,u=>'🏆'+num(u.wins));
    }catch(e){console.error(e)}
  }

  load();
  setInterval(load,15000);
})();
</script>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
function setApi(api) {
  botAPI = api;
  botOnline = true;
}

function start(api) {
  if (api) { botAPI = api; botOnline = true; }
  if (server) return; // already started
  const port = process.env.PORT || config.webPort || 3000;
  server = app.listen(port, "0.0.0.0", () => {
    const chalk = { green: s => s };
    try { Object.assign(chalk, require("chalk")); } catch {}
    console.log(chalk.green(`✓ Web dashboard running → http://0.0.0.0:${port}`));
    console.log(chalk.green(`  Uptime monitor URL: http://0.0.0.0:${port}/ping`));
  });
  server.on("error", err => {
    console.error("Web server error:", err.message);
  });
}

module.exports = { start, setApi, app };
