const log = require('../utils/log.js');
const Discord = require('discord.js');
const endgame = require("../utils/endgame.js");

module.exports = {
    name: 'night',
    su: true,
    cooldown: 1,
    description: "cmd-night-desc",
    
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} _
     */
    execute(message, _) {
        message.client.game.night(message);
    },
};
