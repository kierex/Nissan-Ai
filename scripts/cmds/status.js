"use strict";

module.exports = {
  config: {
    name: "status",
    aliases: ["botstatus", "bstat", "health"],
    description: "Show full bot connection status, session health, and live metrics",
    usage: "status",
    cooldown: 10,
    adminOnly: false,
    category: "info"
  },

  run: async ({ api, event, db, config }) => {
    const state = global.botState || {};
    const now = Date.now();

    // ── Uptime ──────────────────────────────────────────────────────────────
    const uptimeMs = now - (global.startTime || now);
    const s = Math.floor(uptimeMs / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const uptime = d > 0 ? `${d}d ${h%24}h ${m%60}m`
                 : h > 0 ? `${h}h ${m%60}m ${s%60}s`
                 :          `${m}m ${s%60}s`;

    // ── Session age ──────────────────────────────────────────────────────────
    const sessionAge = state.loginTime
      ? (() => {
          const ms2 = now - state.loginTime;
          const sm = Math.floor(ms2/1000/60);
          const sh = Math.floor(sm/60);
          const sd = Math.floor(sh/24);
          return sd > 0 ? `${sd}d ${sh%24}h` : sh > 0 ? `${sh}h ${sm%60}m` : `${sm}m`;
        })()
      : "unknown";

    // ── Last keep-alive ──────────────────────────────────────────────────────
    const lastPingAgo = state.lastKeepAlive
      ? `${Math.floor((now - state.lastKeepAlive) / 1000)}s ago`
      : "never";

    // ── Connection status ────────────────────────────────────────────────────
    const isConnected   = state.mqttConnected === true;
    const isCheckpoint  = state.checkpointActive === true;
    const reconnects    = state.reconnectCount || 0;

    let statusIcon, statusText;
    if (isCheckpoint) {
      statusIcon = "🔴";
      statusText = "CHECKPOINT — Facebook needs security verification";
    } else if (isConnected) {
      statusIcon = "🟢";
      statusText = "CONNECTED — Receiving messages";
    } else {
      statusIcon = "🟡";
      statusText = "RECONNECTING — Attempting to restore connection";
    }

    // ── Memory ───────────────────────────────────────────────────────────────
    const mem = process.memoryUsage();
    const heapMB  = (mem.heapUsed  / 1024 / 1024).toFixed(1);
    const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
    const rssMB   = (mem.rss       / 1024 / 1024).toFixed(1);

    // ── DB stats ─────────────────────────────────────────────────────────────
    let totalUsers = "?", totalCmds = "?";
    try { totalUsers = db.prepare("SELECT COUNT(*) as c FROM users").get().c; } catch {}
    try { totalCmds  = parseInt(db.getStat("total_commands") || "0").toLocaleString(); } catch {}

    // ── Keep-alive health ────────────────────────────────────────────────────
    const keepAliveOk = state.keepAliveOk;
    const keepAliveIcon = keepAliveOk === false ? "❌" : keepAliveOk === true ? "✅" : "⏳";

    const msg =
      `╔══════════════════════════╗\n` +
      `║  🤖  ${config.botName} STATUS REPORT  ║\n` +
      `╚══════════════════════════╝\n\n` +

      `${statusIcon} ${statusText}\n\n` +

      `⏱  Uptime ............. ${uptime}\n` +
      `🔑  Session Age ........ ${sessionAge}\n` +
      `📡  MQTT ............... ${isConnected ? "Connected" : "Disconnected"}\n` +
      `🔄  Reconnects ......... ${reconnects}\n` +
      `💓  Keep-Alive ......... ${keepAliveIcon} (last: ${lastPingAgo})\n` +
      `${isCheckpoint ? `\n⚠️  Checkpoint URL:\nhttps://www.facebook.com${state.checkpointUrl || "/checkpoint/"}\n` : ""}` +

      `\n─── 💾 Memory ──────────────\n` +
      `  Heap:  ${heapMB} MB / ${totalMB} MB\n` +
      `  RSS:   ${rssMB} MB\n` +

      `\n─── 📊 Stats ──────────────\n` +
      `  Users:    ${totalUsers}\n` +
      `  Commands: ${totalCmds} total used\n` +
      `  Loaded:   ${global.commands ? global.commands.size : "?"} commands\n` +

      `\n─── ⚙️  Config ────────────\n` +
      `  Prefix:   ${config.prefix}\n` +
      `  Admin:    ${config.adminBot[0]}\n` +
      `  Version:  v${config.version}\n` +
      `  Node:     ${process.version}` +

      (state.lastError ? `\n\n─── ⛔ Last Error ─────────\n  ${state.lastError}` : "");

    api.sendMessage(msg, event.threadID);
  }
};
