const Role = require('./Role.js');
const log = require('../utils/log.js');
const Discord = require('discord.js');

module.exports = class {
    /**
     * Represents a player in one guild
     * @constructor
     * @param {Discord.Client} client - Bot client
     * @param {Discord.Guild} guild - Guild the player is in
     * @param {Discord.Snowflake} id - User ID of the player
     * @param {Role} role - Role
     */
    constructor(client, guild, id, role){
        this.client = client;
        this.guild = guild;
        this.id = id;
        this.role = role;
    }
}