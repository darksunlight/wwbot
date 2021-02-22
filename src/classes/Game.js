const Player = require('./Player.js');
const Code = require('./Code.js');
const Role = require('./Role.js');
const log = require('../utils/log.js');
const intToEmoji = require('../utils/intToEmoji.js');
const emojiToInt = require('../utils/emojiToInt.js');
const Discord = require('discord.js');
const i18n = require('../i18n.js');

module.exports = class {
    /**
     * Represents a game
     * @constructor
     * @param {Discord.Client} client - Bot client
     * @param {string} code - Role code
     */
    constructor(client, code) {
        this.client = client;
        this.rawcode = code;
        this.ended = false;
        this.code = new Code(this.client, this.rawcode);
    }
    
    /**
     * Starts a game
     * 
     * @param {Discord.Message} message 
     */
    start(message) {
        if(!this.code.isValid()){
            this.ended = true;
            log(message.author.tag + " attempted to start a new game with code " + this.code.code + " but failed due to: The code is invalid.")
            return message.channel.send(`The code ${this.code.code} is invalid.`);
        }
        message.channel.send(`Starting a new game with code ${this.code.code}...`);
        this.roles = this.code.getRoles(message.client.botLocale);
        let rolelist = "";
        this.wolves = [];
        this.gods = [];
        this.villagers = [];
        for(let i=0; i<this.roles.length; i++){
            rolelist+=`${i+1}. ${this.roles[i].name}\n`;
            message.guild.channels.cache.find(x => x.name === String(i+1)+"號").send(`Your role is **${this.roles[i].name}**. Description of your role: ${this.roles[i].desc}`);
            if(this.roles[i].type==="wolf"){
                this.wolves.push(i);
            }else if(this.roles[i].type==="god"){
                this.gods.push(i);
            }else if(this.roles[i].type==="villager"){
                this.villagers.push(i);
            }
        }
        this.wolves.forEach(wolf => message.guild.channels.cache.find(x => x.name === "狼人").updateOverwrite(
            message.guild.roles.cache.find(n => n.name === String(wolf+1) + "號"),
            { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true }
        ));
        this.rolelist = rolelist;
        message.guild.channels.cache.find(x => x.name === "bot-roles").send(rolelist);
        message.channel.send(`Night has fallen. Everyone sleeps. `);
        log(message.author.tag + " started a new game with code " + this.code.code);
    }
}