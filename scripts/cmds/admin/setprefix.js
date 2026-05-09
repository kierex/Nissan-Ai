module.exports = {
  config: {
    name: "setprefix",
    aliases: ["prefix"],
    description: "Change the bot prefix",
    usage: "setprefix <new prefix>",
    cooldown: 5,
    category: "admin",
    adminOnly: true
  },
  run: async ({ api, event, args, config }) => {
    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 3) return api.sendMessage("❌ Provide a valid prefix (max 3 chars).", event.threadID);
    const fs = require("fs");
    config.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    api.sendMessage(`✅ Prefix changed to: ${newPrefix}`, event.threadID);
  }
};
