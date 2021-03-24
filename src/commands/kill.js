const log = require('../utils/log.js');
const Discord = require('discord.js');

module.exports = {
    name: 'kill',
    su: true,
    cooldown: 0.1,
    description: "cmd-kill-desc",
    execute(message, args) {
        message.client.game.kill(args[0], message);
	},
};
