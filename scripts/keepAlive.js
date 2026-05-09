"use strict";

/**
 * Smart session keep-alive for NAV BOT.
 *
 * - Pings Facebook every PING_INTERVAL ms via api.getUserInfo()
 * - Saves fresh appstate after every successful ping
 * - Detects checkpoint / auth failure and updates global.botState
 * - Backs off exponentially if pings fail
 * - Resets backoff on success
 */

const fs   = require("fs");
const path = require("path");

const PING_INTERVAL    = 20 * 60 * 1000; // 20 minutes
const SAVE_INTERVAL    = 5  * 60 * 1000; // save appstate every 5 min regardless
const BACKOFF_BASE     = 60 * 1000;       // start at 1 min on fail
const BACKOFF_MAX      = 30 * 60 * 1000; // max 30 min backoff
const APPSTATE_PATH    = path.join(__dirname, "../appstate.json");

let pingTimer    = null;
let saveTimer    = null;
let failCount    = 0;
let api          = null;
let botID        = null;

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[KeepAlive ${ts}] ${msg}`);
}

function saveAppState() {
  try {
    if (!api) return;
    const fresh = api.getAppState();
    if (!fresh || !fresh.length) return;
    fs.writeFileSync(APPSTATE_PATH, JSON.stringify(fresh, null, 2));
    log("✓ Appstate saved");
  } catch (e) {
    log(`⚠ Appstate save failed: ${e.message}`);
  }
}

function scheduleNextPing(delay) {
  if (pingTimer) clearTimeout(pingTimer);
  pingTimer = setTimeout(doPing, delay || PING_INTERVAL);
}

function doPing() {
  if (!api || !botID) return scheduleNextPing();

  const state = global.botState || {};

  api.getUserInfo(botID, (err, data) => {
    if (err) {
      failCount++;
      const errMsg  = err.error || err.message || JSON.stringify(err);
      const isChk   = errMsg.includes("checkpoint") || (err.errorType === "CHECKPOINT");
      const isAuth  = errMsg.includes("Not logged in") || errMsg.includes("1357001");

      log(`✗ Ping failed (#${failCount}): ${errMsg}`);

      global.botState = {
        ...state,
        keepAliveOk:     false,
        lastError:       errMsg,
        checkpointActive: isChk || state.checkpointActive,
        checkpointUrl:   err.checkpointUrl || state.checkpointUrl,
      };

      if (isChk) {
        log("⚠  CHECKPOINT ACTIVE — bot cannot receive messages.");
        log("   Fix: log into Facebook, clear checkpoint, get fresh appstate.json.");
      } else if (isAuth) {
        log("⚠  Auth failure — cookies may be expired. Update appstate.json.");
      }

      const backoff = Math.min(BACKOFF_BASE * Math.pow(2, failCount - 1), BACKOFF_MAX);
      log(`   Retrying ping in ${Math.round(backoff/1000)}s`);
      scheduleNextPing(backoff);
    } else {
      failCount = 0;
      const name = data[botID] && data[botID].name ? data[botID].name : "Bot";
      log(`✓ Ping OK — session alive as "${name}"`);

      global.botState = {
        ...state,
        keepAliveOk:      true,
        lastKeepAlive:    Date.now(),
        checkpointActive: false,
        lastError:        null,
      };

      saveAppState();
      scheduleNextPing(PING_INTERVAL);
    }
  });
}

function start(apiObj, userID) {
  if (!apiObj || !userID) return;
  api   = apiObj;
  botID = userID;
  failCount = 0;

  // Appstate save timer (independent of ping, more frequent)
  if (saveTimer) clearInterval(saveTimer);
  saveTimer = setInterval(saveAppState, SAVE_INTERVAL);

  log(`Started — pinging every ${PING_INTERVAL/60000} min, saving appstate every ${SAVE_INTERVAL/60000} min`);

  // First ping after 2 minutes (let bot settle)
  scheduleNextPing(2 * 60 * 1000);
}

function stop() {
  if (pingTimer) clearTimeout(pingTimer);
  if (saveTimer) clearInterval(saveTimer);
  pingTimer = null;
  saveTimer = null;
  api  = null;
  botID = null;
  log("Stopped.");
}

module.exports = { start, stop, saveAppState };
