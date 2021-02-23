//const Player = require('./Player.js');
const Code = require('./Code.js');
const Role = require('./Role.js');
const Discord = require('discord.js');
const log = require('../utils/log.js');
const intToEmoji = require('../utils/intToEmoji.js');
const emojiToInt = require('../utils/emojiToInt.js');
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
                i++;
                this.allowWDC(message, i);
            }
        }).catch(console.error);
    }

    _stage1(message) {
        message.channel.send(`Night has fallen. Everyone sleeps. `).then(_=>log("Night has fallen in " + message.guild.name));
        message.guild.channels.cache.find(x => x.name === "狼人").send("Click on the number of the player you would like to kill. (CAUTION: You can't change your mind)").then(msg => {
            for(let i = 0; i < this.roles.length; i++){
                if(this.aliveRaw[i]){
                    msg.react(intToEmoji.main(i));
                }
            }
            msg.awaitReactions(
                (r, u) => {let eArray = intToEmoji.getArray(this.aliveRaw); return eArray.indexOf(r.emoji.name) >= 0 && u.id !== "653535759508439051"},
                {max: 1}
            ).then(collected => {
                let key = emojiToInt(collected.keyArray()[0]);
                msg.channel.send(`Player ${key+1} has been killed.`).then(_ => {
                    this.aliveRaw[key] = false;
                    log(`Player ${key} killed.`);
                    message.channel.send("The wolves' side has killed a player.").then(_ => {
                        this.alive[this.roles[key].type] = this.alive[this.roles[key].type].filter(n => n !== key);
                        let endgStatus = this.checkIfEndgame();
                        if(!endgStatus[0]){
                            return this._stage2(message);
                        }else{
                            if(endgStatus[1]){
                                endgame(message, "Villagers");
                            }else{
                                endgame(message, "Wolves");
                            }
                        }
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
        }).catch(console.error);
    }

    _stage2(message) {
        console.log(this.alive);
        if(this.alive.god.includes(this.witch)){

        }
    }
}