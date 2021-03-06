const log = require('../utils/log.js');
const Discord = require('discord.js');
const endgame = require("../utils/endgame.js");

module.exports = {
    name: 'endgame',
    permissions: 'MANAGE_ROLES',
    cooldown: 1,
    description: "cmd-endgame-desc",
    
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} _
     */
    execute(message, _) {
        return endgame(message, null, true);
    },
};
