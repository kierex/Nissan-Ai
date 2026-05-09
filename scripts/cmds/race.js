const activeRaces = {};

module.exports = {
  config: {
    name: "race",
    aliases: ["racing", "horse"],
    description: "Bet on a horse race",
    usage: "race <horse 1-4> <amount>",
    cooldown: 8,
    category: "games"
  },
  run: async ({ api, event, args, db, config }) => {
    const uid = event.senderID;
    const user = db.getUser(uid);
    if (!user.registered) return api.sendMessage(`❌ Register first! ${config.prefix}register <name>`, event.threadID);

    const horse = parseInt(args[0]);
    const amount = parseInt(args[1]) || 100;

    if (!horse || horse < 1 || horse > 4) {
      return api.sendMessage(
        `🏇 HORSE RACE\n━━━━━━━━━━━━━━\n` +
        `Pick a horse (1-4) and bet!\n\n` +
        `🐎 Horse 1 — Thunderbolt (Odds: 2x)\n` +
        `🐴 Horse 2 — Lucky Star (Odds: 3x)\n` +
        `🦄 Horse 3 — Golden Wing (Odds: 4x)\n` +
        `🏆 Horse 4 — Dark Knight (Odds: 5x)\n\n` +
        `Usage: ${config.prefix}race <1-4> <amount>`,
        event.threadID
      );
    }

    const eco = db.getBalance(uid);
    if (eco.balance < amount) return api.sendMessage(`❌ Not enough coins! Balance: ${config.currency}${eco.balance}`, event.threadID);
    if (amount > 5000) return api.sendMessage("❌ Max bet 5,000!", event.threadID);

    const horses = [
      { name: "Thunderbolt", emoji: "🐎", odds: 2, weight: 40 },
      { name: "Lucky Star",  emoji: "🐴", odds: 3, weight: 30 },
      { name: "Golden Wing", emoji: "🦄", odds: 4, weight: 20 },
      { name: "Dark Knight", emoji: "🏆", odds: 5, weight: 10 }
    ];

    // Animate the race
    const positions = [1, 1, 1, 1];
    const track = 15;
    let raceMsg = "";

    // Random weighted winner
    const total = horses.reduce((s, h) => s + h.weight, 0);
    let r = Math.random() * total;
    let winner = 0;
    for (let i = 0; i < horses.length; i++) {
      r -= horses[i].weight;
      if (r <= 0) { winner = i; break; }
    }

    const buildTrack = (pos) => {
      const bar = "─".repeat(pos) + horses.findIndex((_, i) => pos === positions[i]) >= 0 ? "" : "";
      return "";
    };

    // Final display
    const finalPositions = horses.map((_, i) => {
      if (i === winner) return track;
      return Math.floor(Math.random() * (track - 2)) + 1;
    });
    finalPositions[winner] = track;

    let raceDisplay = `🏁 RACE RESULTS!\n${"─".repeat(24)}\n`;
    const sortedByPos = [...horses].map((h, i) => ({ ...h, pos: finalPositions[i], idx: i })).sort((a, b) => b.pos - a.pos);
    sortedByPos.forEach((h, rank) => {
      const bar = "▓".repeat(Math.floor(h.pos / track * 12)) + "░".repeat(12 - Math.floor(h.pos / track * 12));
      raceDisplay += `${rank + 1}. ${h.emoji} ${h.name}\n   [${bar}]\n`;
    });
    raceDisplay += `${"─".repeat(24)}\n🏆 Winner: ${horses[winner].emoji} ${horses[winner].name}!\n`;

    const playerPicked = horse - 1;
    const won = playerPicked === winner;
    db.updateUser(uid, { games_played: user.games_played + 1 });

    if (won) {
      const prize = amount * horses[winner].odds;
      db.updateBalance(uid, prize - amount);
      db.updateUser(uid, { wins: user.wins + 1 });
      db.addExp(uid, 25);
      raceDisplay += `\n🎉 YOUR HORSE WON!\n+${config.currency}${prize} (x${horses[winner].odds})\n💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`;
    } else {
      db.updateBalance(uid, -amount);
      db.updateUser(uid, { losses: user.losses + 1 });
      raceDisplay += `\n😢 Your horse lost! -${config.currency}${amount}\n💰 Balance: ${config.currency}${db.getBalance(uid).balance.toLocaleString()}`;
    }

    api.sendMessage(raceDisplay, event.threadID);
  }
};
