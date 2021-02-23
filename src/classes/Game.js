//const Player = require('./Player.js');
const Code = require('./Code.js');
const Role = require('./Role.js');
const Discord = require('discord.js');
const log = require('../utils/log.js');
const intToEmoji = require('../utils/intToEmoji.js');
const emojiToInt = require('../utils/emojiToInt.js');
const emojiToBool = require('../utils/emojiToBool.js');
const endgame = require('../utils/endgame.js');
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
    
    checkIfEndgame() {
        if(this.alive.wolf.length === 0){
            return [true, true];
        }else if(this.alive.god.length === 0 || this.alive.villager.length === 0){
            return [true, false];
        }else{
            return [false];
        }
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
        this.alive = {
            "wolf": [],
            "god": [],
            "villager": []
        };
        this.aliveRaw = [];
        this.wolves = [];
        this.gods = [];
        this.villagers = [];
        this.potionStatus = [false, false];
        for(let i=0; i<this.roles.length; i++){
            rolelist+=`${i+1}. ${this.roles[i].name}\n`;
            this.aliveRaw[i] = true;
            message.guild.channels.cache.find(x => x.name === String(i+1)+"號").send(`Your role is **${this.roles[i].name}**. Description of your role: ${this.roles[i].desc}`);
            if(this.roles[i].type==="wolf"){
                this.alive.wolf.push(i);
                this.wolves.push(i);
            }else if(this.roles[i].type==="god"){
                switch (this.roles[i].key) {
                    case "wc":
                        this.witch = i;
                        this.potionStatus = [true, true];
                        break;
                    case "se":
                        this.seer = i;
                        break;
                    case "id":
                        this.idiot = i;
                        break;
                    case "ht":
                        this.hunter = i;
                        break;
                }
                this.alive.god.push(i);
                this.gods.push(i);
            }else if(this.roles[i].type==="villager"){
                this.alive.villager.push(i);
                this.villagers.push(i);
            }
        }
        this.rolelist = rolelist;
        message.guild.channels.cache.find(x => x.name === "bot-roles").send(rolelist);
        log(message.author.tag + " started a new game with code " + this.code.code);
        this.night(message);
    }

    night(message) {
        return this.allowWDC(message, 0);
    }

    allowWDC(message, i) {
        message.guild.channels.cache.find(x => x.name === "狼人").updateOverwrite(
            message.guild.roles.cache.find(n => n.name === String(this.wolves[i]+1) + "號"),
            { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true }
        ).then(_=>{
            log(`Updated wolf discussion channel permission overwrites for player ${String(this.wolves[i])}`);
            if(i == this.wolves.length - 1){
                this._stage1(message);
            }else{
                ++i;
                this.allowWDC(message, i);
            }
        }).catch(console.error);
    }

    /**
     * 
     * @param {Discord.Message} message 
     */

    async _stage1(message) {
        await message.channel.send(`Night has fallen. Everyone sleeps. `);
        log("Night has fallen in " + message.guild.name);
        /** @type {Discord.Message} */
        const msg = await message.guild.channels.cache.find(x => x.name === "狼人").send("Click on the number of the player you would like to kill. (CAUTION: You can't change your mind)");
        for(let i = 0; i < this.roles.length; i++){
            if(this.aliveRaw[i]){
                await msg.react(intToEmoji.main(i));
            }
        }
        let wfRolesNames = [];
        for(let i = 0; i < this.alive.wolf.length; i++){
            wfRolesNames.push(`${String(this.alive.wolf[i] + 1)}號`);
        }
        const collected = await msg.awaitReactions(
            async (r, u) => {
                let eArray = intToEmoji.getArray(this.aliveRaw);
                if(u.bot || eArray.indexOf(r.emoji.name) < 0) return false;
                const user = await message.guild.members.fetch(u.id);
                let roles = user.roles.cache.array();
                for(let i = 0; i < roles.length; i++){
                    let role = roles[i];
                    if(role.name == "Dead"){
                        log(`Spectator ${user.user.tag} attempted to use the save potion despite being dead.`);
                        return false;
                    }else if(role.name == "MC" || role.name == "Developer" || wfRolesNames.includes(role.name)){
                        return true;
                    }
                }
                return false;
            }, 
            {max: 1}
        );
        msg.delete();
        let key = emojiToInt(collected.keyArray()[0]);
        msg.channel.send(`Player ${key+1} has been killed.`).then(_ => {
            this.aliveRaw[key] = false;
            this.alive[this.roles[key].type] = this.alive[this.roles[key].type].filter(n => n !== key);
            log(`Player ${key} killed.`);
            message.channel.send("The wolves' side has killed a player.").then(_ => {
                let endgStatus = this.checkIfEndgame();
                if(!endgStatus[0]){
                    return this._stageWCSave(message, key);
                }else{
                    if(endgStatus[1]){
                        endgame(message, "Villagers");
                    }else{
                        endgame(message, "Wolves");
                    }
                }
            }).catch(console.error);
        }).catch(console.error);
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Number} killed 
     */
    async _stageWCSave(message, killed) {
        console.log(this.alive);
        if(this.alive.god.includes(this.witch) || killed === this.witch){
            if(this.potionStatus[0]){
                /** @type {Discord.Message} */
                const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.witch+1)}號`).send(`Player ${killed+1} was killed tonight. Use the save potion?`);
                await msg.react("✅");
                await msg.react("❎");
                const collected = await msg.awaitReactions(
                    async (r, u) => {
                        if(u.bot || !["✅", "❎"].includes(r.emoji.name)) return false;
                        const user = await message.guild.members.fetch(u.id);
                        let roles = user.roles.cache.array();
                        for(let i = 0; i < roles.length; i++){
                            let role = roles[i];
                            if(role.name == "Dead"){
                                log(`Spectator ${user.user.tag} attempted to use the save potion despite being dead.`);
                                return false;
                            }else if(role.name == "MC" || role.name == "Developer" || role.name == `${String(this.witch+1)}號`){
                                return true;
                            }
                        }
                        return false;
                    },
                    {max: 1}
                );
                msg.delete();
                let saved = emojiToBool(collected.keyArray()[0]);
                console.log(saved);
                if(saved){
                    this.aliveRaw[killed] = true;
                    this.alive[this.roles[killed].type].push(killed);
                    msg.channel.send(`Player ${String(killed+1)} saved!`);
                    console.log(this.alive);
                    this._stageSESee(message, []);
                }
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Array} killed 
     */
    _stageSESee(message, killed) {

    }
}