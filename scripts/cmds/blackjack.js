const games = {};

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const vals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (const s of suits) for (const v of vals) deck.push({ suit: s, value: v });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (["J", "Q", "K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}

function handValue(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.value === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function handStr(hand) {
  return hand.map(c => `${c.value}${c.suit}`).join(" ");
}

module.exports = {
  config: {
    name: "blackjack",
    aliases: ["bj", "21"],
    description: "Play Blackjack against the bot",
    usage: "blackjack <amount> | hit | stand",
    cooldown: 3,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! Use: ${config.prefix}register <name>`, event.threadID);

    const action = (args[0] || "").toLowerCase();

    if (games[uid] && (action === "hit" || action === "h")) {
      const game = games[uid];
      game.playerHand.push(game.deck.pop());
      const pVal = handValue(game.playerHand);
      if (pVal > 21) {
        db.updateBalance(uid, -game.bet);
        db.updateUser(uid, { losses: user.losses + 1, games_played: user.games_played + 1 });
        delete games[uid];
        return api.sendMessage(
          `🃏 BLACKJACK - BUST!\n` +
          `Your hand: ${handStr(game.playerHand)} = ${pVal}\n` +
          `😢 Busted! Lost ${config.currency}${game.bet}\n` +
          `💰 Balance: ${config.currency}${db.getBalance(uid).balance}`,
          event.threadID
        );
      }
      return api.sendMessage(
        `🃏 BLACKJACK\n` +
        `Your hand: ${handStr(game.playerHand)} = ${pVal}\n` +
        `Dealer shows: ${game.dealerHand[0].value}${game.dealerHand[0].suit}\n` +
        `Bet: ${config.currency}${game.bet}\n\n` +
        `Type ${config.prefix}blackjack hit or ${config.prefix}blackjack stand`,
        event.threadID
      );
    }

    if (games[uid] && (action === "stand" || action === "s")) {
      const game = games[uid];
      while (handValue(game.dealerHand) < 17) game.dealerHand.push(game.deck.pop());
      const pVal = handValue(game.playerHand);
      const dVal = handValue(game.dealerHand);
      db.updateUser(uid, { games_played: user.games_played + 1 });

      let result;
      if (dVal > 21 || pVal > dVal) {
        db.updateBalance(uid, game.bet);
        db.updateUser(uid, { wins: user.wins + 1 });
        db.addExp(uid, 20);
        result = `🎉 YOU WIN! +${config.currency}${game.bet}`;
      } else if (pVal === dVal) {
        result = `🤝 TIE! No change`;
      } else {
        db.updateBalance(uid, -game.bet);
        db.updateUser(uid, { losses: user.losses + 1 });
        result = `😢 YOU LOSE! -${config.currency}${game.bet}`;
      }
      delete games[uid];
      return api.sendMessage(
        `🃏 BLACKJACK - RESULT\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `Your: ${handStr(game.playerHand)} = ${pVal}\n` +
        `Dealer: ${handStr(game.dealerHand)} = ${dVal}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${result}\n` +
        `💰 Balance: ${config.currency}${db.getBalance(uid).balance}`,
        event.threadID
      );
    }

    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return api.sendMessage(`🃏 BLACKJACK\nUsage: ${config.prefix}blackjack <bet>\nThen: ${config.prefix}blackjack hit/stand`, event.threadID);
    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 10000) return api.sendMessage("❌ Max bet is 10,000!", event.threadID);

    const deck = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    const pVal = handValue(playerHand);

    if (pVal === 21) {
      const win = Math.floor(amount * 1.5);
      db.updateBalance(uid, win);
      db.updateUser(uid, { wins: user.wins + 1, games_played: user.games_played + 1 });
      return api.sendMessage(
        `🃏 BLACKJACK - NATURAL 21!\n` +
        `Your hand: ${handStr(playerHand)} = 21\n` +
        `🎉 BLACKJACK! Won ${config.currency}${win}\n` +
        `💰 Balance: ${config.currency}${db.getBalance(uid).balance}`,
        event.threadID
      );
    }

    games[uid] = { deck, playerHand, dealerHand, bet: amount };
    api.sendMessage(
      `🃏 BLACKJACK STARTED!\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Your hand: ${handStr(playerHand)} = ${pVal}\n` +
      `Dealer shows: ${dealerHand[0].value}${dealerHand[0].suit}\n` +
      `Bet: ${config.currency}${amount}\n\n` +
      `${config.prefix}blackjack hit — Draw a card\n` +
      `${config.prefix}blackjack stand — End your turn`,
      event.threadID
    );
  }
};
