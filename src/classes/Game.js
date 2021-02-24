//const Player = require('./Player.js');
const Code = require('./Code.js');
const Role = require('./Role.js');
const Discord = require('discord.js');
const log = require('../utils/log.js');
const intToEmoji = require('../utils/intToEmoji.js');
const emojiToAny = require('../utils/emojiToAny.js');
const emojiToBool = require('../utils/emojiToBool.js');
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
                        this.checked = [];
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
        log("Reacted to message and waiting for user input, wolf");
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
                        log(`${user.user.tag} made a decision as wolf`);
                        return true;
                    }
                }
                return false;
            }, 
            {max: 1}
        );
        await msg.delete();
        let key = emojiToInt(collected.keyArray()[0]);
        this.aliveRaw[key] = false;
        this.alive[this.roles[key].type] = this.alive[this.roles[key].type].filter(n => n !== key);
        await msg.channel.send(`Player ${key+1} has been killed.`);
        log(`Player ${key} killed.`);
        await message.channel.send("The wolves' side has killed a player.");
        log(`Notified public about wolf kill`);
        let endgStatus = this.checkIfEndgame();
        if(!endgStatus[0]){
            log(`Wolf killed, endgame criteria not fulfilled, proceeding to witch`);
            return this._stageWCSave(message, key);
        }else{
            if(endgStatus[1]){
                log(`Wolf killed, endgame criteria fulfilled, villager win, proceeding to endgame`);
                endgame(message, i18n("game-vls", message.client.botLocale));
            }else{
                log(`Wolf killed, endgame criteria fulfilled, wolf win, proceeding to endgame`);
                endgame(message, i18n("game-wfs", message.client.botLocale));
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {number} killed 
     */
    async _stageWCSave(message, killed) {
        console.log(this.alive);
        if(this.aliveRaw[this.witch] || killed === this.witch){
            if(this.potionStatus[0]){
                /** @type {Discord.Message} */
                const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.witch+1)}號`).send(`Player ${killed+1} was killed tonight. Use the save potion?`);
                await msg.react("✅");
                await msg.react("❎");
                log("Reacted to message and waiting for user input, witch save");
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
                                log(`${user.user.tag} made a decision as witch, wcsave`);
                                return true;
                            }
                        }
                        return false;
                    },
                    {max: 1}
                );
                await msg.delete();
                let saved = emojiToBool(collected.keyArray()[0]);
                if(saved){
                    this.aliveRaw[killed] = true;
                    this.alive[this.roles[killed].type].push(killed);
                    this.potionStatus[0] = false;
                    await msg.channel.send(`Player ${String(killed+1)} saved!`);
                    log(`Player ${String(killed)} revived by witch`);
                    console.log(this.alive);
                    this._stageSESee(message, false, false);
                }else{
                    await msg.channel.send(`You refused to save player ${String(killed+1)}.`);
                    log(`Witch refused to save ${String(killed)}`);
                    console.log(this.alive);
                    this._stageWCPoison(message, killed);
                }
            }else{
                log(`Witch save potion used up, skipping to witch poison`);
                this._stageWCPoison(message, killed);
            }
        }else{
            log(`Witch is dead and cannot revive self, skipping to seer`);
            this._stageSESee(message, killed, false);
        }
    }
    /**
     * 
     * @param {Discord.Message} message 
     * @param {number} killed 
     */
    async _stageWCPoison(message, killed) {
        if(this.aliveRaw[this.witch] || killed === this.witch){
            if(this.potionStatus[1]){
                /** @type {Discord.Message} */
                const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.witch+1)}號`).send(`Who would you like to poison?`);
                let eArray = [];
                for(let i = 0; i < this.roles.length; i++){
                    if(killed === i){
                        eArray.push(intToEmoji.main(i));
                    }else if(this.aliveRaw[i] && i !== this.witch){
                        eArray.push(intToEmoji.main(i));
                    }
                }
                eArray.push("❎");
                eArray.forEach(async e => await msg.react(e));
                log("Reacted to message and waiting for user input, witch poison");
                const collected = await msg.awaitReactions(
                    async (r, u) => {
                        if(u.bot || !eArray.includes(r.emoji.name)) return false;
                        const user = await message.guild.members.fetch(u.id);
                        let roles = user.roles.cache.array();
                        for(let i = 0; i < roles.length; i++){
                            let role = roles[i];
                            if(role.name == "Dead"){
                                log(`Spectator ${user.user.tag} attempted to use the poison potion despite being dead.`);
                                return false;
                            }else if(role.name == "MC" || role.name == "Developer" || role.name == `${String(this.witch+1)}號`){
                                log(`${user.user.tag} made a decision as witch, wcpoison`);
                                return true;
                            }
                        }
                        return false;
                    },
                    {max: 1}
                );
                await msg.reactions.removeAll();
                let poisoned = emojiToAny(collected.keyArray()[0]);
                if(poisoned === false){
                    log(`Witch chose to not use poison, proceeding to seer`);
                    msg.channel.send(`You have chosen to not use your poison potion tonight.`);
                    return this._stageSESee(message, killed, false);
                }else{
                    log(`Witch chose to poison ${poisoned}`);
                    msg.channel.send(`:test_tube: Player ${String(poisoned+1)} poisoned.`);
                    this.aliveRaw[poisoned] = false;
                    this.alive[this.roles[poisoned].type] = this.alive[this.roles[poisoned].type].filter(n => n !== poisoned);
                    this.potionStatus[1] = false;
                    let endgStatus = this.checkIfEndgame();
                    if(!endgStatus[0]){
                        log(`Witch poisoned, endgame criteria not fulfilled, proceeding to seer`);
                        if(killed == poisoned){
                            return this._stageSESee(message, killed, false);
                        }else{
                            return this._stageSESee(message, killed, poisoned);
                        }
                    }else{
                        if(endgStatus[1]){
                            log(`Witch poisoned, endgame criteria fulfilled, villager win, proceeding to endgame`);
                            return endgame(message, i18n("game-vls", message.client.botLocale));
                        }else{
                            log(`Witch poisoned, endgame criteria fulfilled, wolf win, proceeding to endgame`);
                            return endgame(message, i18n("game-wfs", message.client.botLocale));
                        }
                    }
                }
            }else{
                log(`Witch poison potion used up, skipping to seer`);
                this._stageSESee(message, killed, false);
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {number|boolean} killed 
     * @param {number|boolean} poisoned
     */
    async _stageSESee(message, killed, poisoned) {
        let died = [killed, poisoned];
        if(this.aliveRaw[this.seer] || died.includes(this.seer)){
            /** @type {Discord.Message} */
            const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.seer+1)}號`).send(`Click on the number of the player you would like to check. `);
            let eArray = [];
            for(let i = 0; i < this.roles.length; i++){
                if(died.includes(i)){
                    eArray.push(intToEmoji.main(i));
                }else if(this.aliveRaw[i] && i !== this.seer && !this.checked.includes(i)){
                    eArray.push(intToEmoji.main(i));
                }
            }
            eArray.forEach(async e => await msg.react(e));
            log("Reacted to message and waiting for user input, seer");
            const collected = await msg.awaitReactions(
                async (r, u) => {
                    if(u.bot || !eArray.includes(r.emoji.name)) return false;
                    const user = await message.guild.members.fetch(u.id);
                    let roles = user.roles.cache.array();
                    for(let i = 0; i < roles.length; i++){
                        let role = roles[i];
                        if(role.name == "Dead"){
                            log(`Spectator ${user.user.tag} attempted to use the save potion despite being dead.`);
                            return false;
                        }else if(role.name == "MC" || role.name == "Developer" || role.name == `${String(this.seer+1)}號`){
                            log(`${user.user.tag} made a decision as seer`);
                            return true;
                        }
                    }
                    return false;
                },
                {max: 1}
            );
            await msg.delete();
            let checked = emojiToInt(collected.keyArray()[0]);
            if(this.roles[checked].type === "wolf"){
                await msg.channel.send(`Player ${String(checked+1)} is bad!`);
                log(`Player ${String(checked)} revealed to seer as bad`);
            }else{
                await msg.channel.send(`Player ${String(checked+1)} is good!`);
                log(`Player ${String(checked)} revealed to seer as good`);
            }
            this.day(message, killed, poisoned);
        }else{
            log(`Seer is dead, skipping to day.`);
            this.day(message, killed, poisoned);
        }
    }

    /**
     * Function for day time
     * @param {Discord.Message} message 
     * @param {number|boolean} killed 
     * @param {number|boolean} poisoned 
     */
    async day(message, killed, poisoned) {
        let endgStatus = this.checkIfEndgame();
        if(endgStatus[0]){
            if(endgStatus[1]){
                log(`Day time, endgame criteria fulfilled, villager win, proceeding to endgame`);
                return endgame(message, i18n("game-vls", message.client.botLocale));
            }else{
                log(`Day time, endgame criteria fulfilled, wolf win, proceeding to endgame`);
                return endgame(message, i18n("game-wfs", message.client.botLocale));
            }
        }
        let died = [killed, poisoned];
        let dieCount = 0;
        for(let i = 0; i < died.length; i++){
            if(died[i]!==false) ++dieCount;
        }
        await message.channel.send(i18n("game-day-announce-0", message.client.botLocale));
        if(dieCount === 2){
            died.sort((a, b) => a - b);
            try{
                await message.channel.send(i18n("game-day-announce-1", message.client.botLocale, dieCount));
                await message.channel.send(i18n("game-day-announce-2", message.client.botLocale, died[0]+1, died[1]+1));
            }catch(e){
                console.error(e);
            }
        }else if(dieCount === 1){
            await message.channel.send(i18n("game-day-announce-1", message.client.botLocale, dieCount));
            for(let i = 0; i < died.length; i++){
                if(died[i]!==false){
                    await message.channel.send(i18n("game-day-announce-3", message.client.botLocale, died[i]+1));
                }
            }
        }else if(dieCount === 0){
            await message.channel.send(i18n("game-day-announce-silent-night", message.client.botLocale));
        }else{
            await message.channel.send("Something went wrong...");
        }
    }
}