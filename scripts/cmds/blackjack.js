module.exports = {
  config: {
    name: "blackjack",
    aliases: ["bj", "21"],
    version: "1.0",
    author: "CowBot",
    countDown: 5,
    role: 0,
    shortDescription: "Play Blackjack",
    description: { en: "Play a game of Blackjack (21) against the dealer" },
    category: "game",
    guide: { en: "{pn}blackjack [hit|stand|new]" }
  },
  onStart: async function ({ message, args, event, threadsData, usersData }) {
    const tid = event.threadID;
    const uid = event.senderID;
    const suits = ["♠","♥","♦","♣"];
    const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    const val = r => r === "A" ? 11 : ["J","Q","K"].includes(r) ? 10 : parseInt(r);
    const newDeck = () => suits.flatMap(s => ranks.map(r => ({ s, r }))).sort(() => Math.random() - 0.5);
    const handVal = (h) => {
      let v = h.reduce((a,c) => a + val(c.r), 0);
      let aces = h.filter(c => c.r === "A").length;
      while (v > 21 && aces-- > 0) v -= 10;
      return v;
    };
    const fmt = (h) => h.map(c => c.r + c.s).join(" ");

    const action = (args[0] || "new").toLowerCase();
    let state;
    try { state = (await threadsData.get(tid, "data"))?.bj?.[uid]; } catch(e) {}

    if (action === "new" || !state) {
      const deck = newDeck();
      state = { deck, player: [deck.pop(), deck.pop()], dealer: [deck.pop(), deck.pop()], bet: 100 };
      try {
        const d = await threadsData.get(tid, "data") || {};
        if (!d.bj) d.bj = {};
        d.bj[uid] = state;
        await threadsData.set(tid, { data: d });
      } catch(e) {}
      return message.reply(`🃏 BLACKJACK\n━━━━━━━━━━━━\nYour hand: ${fmt(state.player)} (${handVal(state.player)})\nDealer  : ${state.dealer[0].r + state.dealer[0].s} ??\n\n!blackjack hit | stand`);
    }
    if (action === "hit") {
      state.player.push(state.deck.pop());
      const pv = handVal(state.player);
      if (pv > 21) {
        try { const d = await threadsData.get(tid, "data") || {}; if(d.bj) delete d.bj[uid]; await threadsData.set(tid, { data: d }); } catch(e) {}
        return message.reply(`🃏 BLACKJACK\n━━━━━━━━━━━━\nYour hand: ${fmt(state.player)} (${pv})\n\n💥 BUST! You went over 21. Dealer wins!`);
      }
      try { const d = await threadsData.get(tid, "data") || {}; if(!d.bj) d.bj = {}; d.bj[uid] = state; await threadsData.set(tid, { data: d }); } catch(e) {}
      return message.reply(`🃏 BLACKJACK\n━━━━━━━━━━━━\nYour hand: ${fmt(state.player)} (${pv})\nDealer  : ${state.dealer[0].r + state.dealer[0].s} ??\n\n!blackjack hit | stand`);
    }
    if (action === "stand") {
      while (handVal(state.dealer) < 17) state.dealer.push(state.deck.pop());
      const pv = handVal(state.player), dv = handVal(state.dealer);
      let outcome;
      if (dv > 21 || pv > dv) { outcome = "🟢 YOU WIN! +200 coins"; try { const u = await usersData.get(uid); await usersData.set(uid, { money: (u.money || 0) + 200 }); } catch(e) {} }
      else if (pv === dv) { outcome = "🟡 TIE!"; }
      else { outcome = "🔴 DEALER WINS!"; }
      try { const d = await threadsData.get(tid, "data") || {}; if(d.bj) delete d.bj[uid]; await threadsData.set(tid, { data: d }); } catch(e) {}
      message.reply(`🃏 BLACKJACK\n━━━━━━━━━━━━\nYour hand: ${fmt(state.player)} (${pv})\nDealer  : ${fmt(state.dealer)} (${dv})\n\n${outcome}`);
    }
  }
};
