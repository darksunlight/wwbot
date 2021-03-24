//const Player = require('./Player.js');
const Code = require('./Code.js');
const Role = require('./Role.js');
const Discord = require('discord.js');
const log = require('../utils/log.js');
const intToEmoji = require('../utils/intToEmoji.js');
const emojiToAny = require('../utils/emojiToAny.js');
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

    async kill(killed, message) {
        this.aliveRaw[killed] = false;
        this.alive[this.roles[killed].type] = this.alive[this.roles[killed].type].filter(n => n !== killed);
        const role = await message.guild.roles.cache.find(r => r.name === `${String(killed+1)}號`);
        console.log(role.members);
    }

    /**
     * Starts a game
     * 
     * @param {Discord.Message} message 
     */
    start(message) {
        this.message = message;
        if(!this.code.isValid()){
            this.ended = true;
            log(message.author.tag + " attempted to start a new game with code " + this.code.code + " but failed due to: The code is invalid.")
            return message.channel.send(`The code ${this.code.code} is invalid.`);
        }
        message.channel.send(`Starting a new game with code ${this.code.code}...`);
        this.roles = this.code.getRoles(message.client.botLocale);
        /** number of players */
        this.players = this.roles.length;
        let rolelist = "";
        this.alive = {
            "wolf": [],
            "god": [],
            "villager": []
        };
        /** raw array of IDs of players that are alive */
        this.aliveRaw = [];
        this.wolves = [];
        this.gods = [];
        this.villagers = [];
        this.potionStatus = [false, false];
        this.wfKilled = 99;
        for(let i=0; i<this.roles.length; i++){
            rolelist+=`${i+1}. ${this.roles[i].name}\n`;
            this.aliveRaw[i] = true;
            message.guild.channels.cache.find(x => x.name === String(i+1)+"號").send(`Your role is **${this.roles[i].name}**. Description of your role: ${this.roles[i].desc}`);
            if(this.roles[i].type==="wolf"){
                if(this.roles[i].key === "wk") {
                    this.wolfk = i;
                }
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
                        this.idiotUsed = false;
                        break;
                    case "ht":
                        this.hunter = i;
                        break;
                    case "kt":
                        this.knight = i;
                        this.ktChecked = false;
                        break;
                    case "gd":
                        this.guard = i;
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

    /**
     * 
     * @param {Discord.Message} message 
     * @returns 
     */
    night(message) {
        return this.allowWDC(message, 0);
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {number} i 
     */
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
     * Stage 1 - Wolf Kill
     * 
     * @param {Discord.Message} message 
     */

    async _stage1(message) {
        await message.channel.send(i18n("game-night-announce", message.client.botLocale));
        log("Night has fallen in " + message.guild.name);
        /** @type {Discord.Message} */
        const msg = await message.guild.channels.cache.find(x => x.name === "狼人").send(i18n("game-wf-prompt", message.client.botLocale));
        for(let i = 0; i < this.roles.length; i++){
            if(this.aliveRaw[i] && i !== this.wfKilled){
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
        let key = emojiToAny(collected.keyArray()[0]);
        this.aliveRaw[key] = false;
        this.alive[this.roles[key].type] = this.alive[this.roles[key].type].filter(n => n !== key);
        this.wfKilled = key;
        await msg.channel.send(`Player ${key+1} has been killed.`);
        log(`Player ${key} killed.`);
        await message.channel.send("The wolves' side has killed a player.");
        log(`Notified public about wolf kill`);
        let endgStatus = this.checkIfEndgame();
        if(!endgStatus[0]){
            log(`Wolf killed, endgame criteria not fulfilled, proceeding to witch`);
            return this._stageWCSave(message);
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
     */
    async _stageWCSave(message) {
        console.log(this.alive);
        if(this.aliveRaw[this.witch] || this.wfKilled === this.witch){
            if(this.potionStatus[0]){
                /** @type {Discord.Message} */
                const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.witch+1)}號`).send(i18n("game-wcsave-prompt", message.client.botLocale, this.wfKilled+1));
                await msg.react("✅");
                await msg.react("❎");
                log("Reacted to message and waiting for user input, witch save");
                const collected = await msg.awaitReactions(
                    async (r, u) => {
                        if(u.bot || !["✅", "❎"].includes(r.emoji.name)) return false;
                        const member = await message.guild.members.fetch(u.id);
                        let roles = member.roles.cache.array();
                        for(let i = 0; i < roles.length; i++){
                            let role = roles[i];
                            if(role.name == "Dead"){
                                log(`Spectator ${member.user.tag} attempted to use the save potion despite being dead.`);
                                return false;
                            }else if(role.name == "MC" || role.name == "Developer" || role.name == `${String(this.witch+1)}號`){
                                log(`${member.user.tag} made a decision as witch, wcsave`);
                                return true;
                            }
                        }
                        return false;
                    },
                    {max: 1}
                );
                await msg.delete();
                let saved = emojiToAny(collected.keyArray()[0]);
                if(saved){
                    this.aliveRaw[this.wfKilled] = true;
                    this.alive[this.roles[this.wfKilled].type].push(this.wfKilled);
                    this.potionStatus[0] = false;
                    await msg.channel.send(i18n("game-wcsave-saved", message.client.botLocale, String(this.wfKilled+1)));
                    log(`Player ${String(this.wfKilled)} revived by witch`);
                    console.log(this.alive);
                    this._stageSESee(message, false, false);
                }else{
                    await msg.channel.send(i18n("game-wcsave-refused", message.client.botLocale, String(this.wfKilled+1)));
                    log(`Witch refused to save ${String(this.wfKilled)}`);
                    console.log(this.alive);
                    this._stageWCPoison(message, this.wfKilled);
                }
            }else{
                log(`Witch save potion used up, skipping to witch poison`);
                this._stageWCPoison(message, this.wfKilled);
            }
        }else{
            log(`Witch is dead and cannot revive self, skipping to seer`);
            this._stageSESee(message, this.wfKilled, false);
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
                const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.witch+1)}號`).send(i18n("game-wcpoison-prompt", message.client.botLocale));
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
                    msg.channel.send(i18n("game-wcpoison-nopoison", message.client.botLocale));
                    return this._stageSESee(message, killed, false);
                }else{
                    log(`Witch chose to poison ${poisoned}`);
                    msg.channel.send(i18n("game-wcpoison-poisoned", message.client.botLocale, String(poisoned+1)));
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
            const msg = await message.guild.channels.cache.find(x => x.name === `${String(this.seer+1)}號`).send(i18n("game-sesee-prompt", message.client.botLocale));
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
            let checked = emojiToAny(collected.keyArray()[0]);
            if(this.roles[checked].type === "wolf"){
                await msg.channel.send(i18n("game-sesee-bad", message.client.botLocale, String(checked+1)));
                log(`Player ${String(checked)} revealed to seer as bad`);
            }else{
                await msg.channel.send(i18n("game-sesee-good", message.client.botLocale, String(checked+1)));
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
            await message.channel.send(i18n("game-day-announce-1", message.client.botLocale, dieCount)).catch(console.error);
            await message.channel.send(i18n("game-day-announce-2", message.client.botLocale, died[0]+1, died[1]+1)).catch(console.error);
            if(killed === this.hunter || killed === this.wolfk) {
                await this.htwkOnDie(killed, "vote");
            }else {
                this.vote(message);
            }
        }else if(dieCount === 1){
            await message.channel.send(i18n("game-day-announce-1", message.client.botLocale, dieCount));
            for(let i = 0; i < died.length; i++){
                if(died[i]!==false){
                    await message.channel.send(i18n("game-day-announce-3", message.client.botLocale, died[i]+1));
                }
            }
            if(killed === this.hunter || killed === this.wolfk) {
                await this.htwkOnDie(killed, "vote");
            }else {
                this.vote(message);
            }
        }else if(dieCount === 0){
            await message.channel.send(i18n("game-day-announce-silent-night", message.client.botLocale));
            this.vote(message);
        }else{
            await message.channel.send("Something went wrong...");
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async vote(message) {
        /** @type boolean[] */
        this.voted = [];
        /** @type number[] */
        this.votes = [];
        /** @type number[][] */
        this.votedBy = [];
        this.voteKey = (Math.random()*1e16).toString(36); // from https://stackoverflow.com/a/30925561, CC BY-SA 3.0 he-yaeh
        await message.channel.send(i18n("game-day-instruct-mc", message.client.botLocale, this.voteKey));
        const collected = await message.channel.awaitMessages(
            msg => {
                return !msg.author.bot && msg.content === `!vote ${this.voteKey}` && (msg.member.roles.cache.some(role => role.name === "MC") || msg.member.roles.cache.some(role => role.name === "Developer"));
            },
            { max: 1 }
        );
        await message.channel.send(`Voting procedure initiated.`);
        log(`Voting procedure initiated by ${collected.first().author.tag}`);
        let eligible = [];
        let candidates = [];
        for(let i = 0; i < this.players; i++){
            if(this.aliveRaw[i]){
                this.voted[i] = false;
                eligible.push(i);
                candidates.push(intToEmoji.main(i));
            }else{
                this.voted[i] = true;
            }
            this.votes[i] = 0;
            this.votedBy[i] = [];
        }
        candidates.push("❎");
        eligible.forEach(i => this.sendVoteMsg(i, candidates));
    }

    /**
     * 
     * @param {number} id - Player id to send the vote message to
     * @param {string[]} candidates - Array of emojis representing voting candidates
     */
    async sendVoteMsg(id, candidates) {
        let message = this.message;
        /** @type {Discord.Message} */
        const votemsg = await message.guild.channels.cache.find(x => x.name === `${id+1}號`).send(i18n("game-vote-msg", message.client.botLocale));
        candidates.forEach(async i => {
            await votemsg.react(i);
        });
        const collected = await votemsg.awaitReactions(
            /**
             * 
             * @param {Discord.MessageReaction} r 
             * @param {Discord.User} u 
             * @returns
             */
            async (r, u) => {
                if(u.bot || !candidates.includes(r.emoji.name)) return false;
                const member = await message.guild.members.fetch(u.id);
                let roles = member.roles.cache.array();
                for(let i = 0; i < roles.length; i++){
                    let role = roles[i];
                    if(role.name === "Dead"){
                        log(`Spectator ${member.user.tag} attempted to vote ${emojiToAny(r.emoji.name)} despite being dead.`);
                        return false;
                    }else if(role.name === "MC" || role.name === "Developer" || role.name == `${String(id+1)}號`){
                        log(`${member.user.tag} voted ${emojiToAny(r.emoji.name)} as player ${id}`);
                        return true;
                    }
                }
                return false;
            },
            {max: 1}
        );
        await votemsg.delete();
        let target = emojiToAny(collected.keyArray()[0]);
        this.voteHandler(id, target);
    }

    /**
     * 
     * @param {number} voter 
     * @param {number|boolean} target 
     */
    async voteHandler(voter, target) {
        let message = this.message;
        this.voted[voter] = true;
        const channel = message.guild.channels.cache.find(x => x.name === `${voter+1}號`);
        if(target !== false){
            ++this.votes[target];
            this.votedBy[target].push(voter);
            channel.send(`You have voted for player ${target+1}.`);
        }else{
            channel.send(`You have discarded your vote.`);
        }
        if(!this.voted.includes(false)){
            this.endvote();
        }
    }

    async endvote(){
        let message = this.message;
        message.channel.send(i18n("game-vote-ended", message.client.botLocale));
        const maxvotes = this.votes.reduce((m, n) => Math.max(m, n));
        const mostvoted = [...this.votes.keys()].filter(i => this.votes[i] === maxvotes);
        log("");
        console.log(mostvoted);
        for(let i = 0; i < this.votes.length; i++) {
            this.votedBy[i].sort((a, b) => a - b);
            if(this.votes[i] > 0) {
                let msgText = `**Player ${i+1}** - `;
                for(let j = 0; j < this.votedBy[i].length - 1; j++) {
                    msgText = msgText.concat(i18n("game-vote-announce-player-hl-item", message.client.botLocale, this.votedBy[i][j] + 1), i18n("comma-separator", message.client.botLocale));
                }
                msgText = msgText.concat(i18n("game-vote-announce-player-hl-item", message.client.botLocale, this.votedBy[i][this.votedBy[i].length - 1] + 1));
                console.log(i);
                console.log(this.votedBy[i]);
                message.channel.send(msgText);
            }
        }
        if(mostvoted.length === 1) {
            switch (this.roles[mostvoted[0]].key) {
                case "id":
                    if(!this.idiotUsed) {
                        this.idiotUsed = true;
                        await message.channel.send(`Player ${mostvoted[0] + 1} is the idiot! They remain alive.`);
                        return this.night(message);
                    }else {
                        this.night(message);
                    }
                    break;
                case "ht":
                case "wk":
                    await message.channel.send(i18n("game-vote-announce-eliminated", message.client.botLocale, mostvoted[0] + 1));
                    this.kill(mostvoted[0], message);
                    this.htwkOnDie(mostvoted[0], "night");
                    break;
                default:
                    await message.channel.send(i18n("game-vote-announce-eliminated", message.client.botLocale, mostvoted[0] + 1));
                    this.kill(mostvoted[0], message);
                    let endgStatus = this.checkIfEndgame();
                    if(!endgStatus[0]){
                        log(`Player voted out, endgame criteria not fulfilled, proceeding to night.`);
                        return this.night(message);
                    }else{
                        if(endgStatus[1]){
                            log(`Player voted out, endgame criteria fulfilled, villager win, proceeding to endgame`);
                            return endgame(message, i18n("game-vls", message.client.botLocale));
                        }else{
                            log(`Player voted out, endgame criteria fulfilled, wolf win, proceeding to endgame`);
                            return endgame(message, i18n("game-wfs", message.client.botLocale));
                        }
                    }
                    break;
            }
        }else if(mostvoted.length > 1) {
            let msgText = i18n("game-vote-samevotes-0", message.client.botLocale, mostvoted.length, maxvotes);
            let hl = "";
            for(let i = 0; i < mostvoted.length - 2; i++) {
                hl = hl.concat(i18n("game-vote-announce-player-hl-item", message.client.botLocale, mostvoted[i] + 1), i18n("comma-separator", message.client.botLocale));
            }
            hl = hl.concat(i18n("game-vote-announce-player-hl-item", message.client.botLocale, mostvoted[mostvoted.length - 2] + 1), i18n("and-separator", message.client.botLocale), i18n("game-vote-announce-player-hl-item", message.client.botLocale, mostvoted[mostvoted.length - 1] + 1));
            hl = i18n("game-vote-samevotes-1", message.client.botLocale, hl);
            msgText = msgText.concat("\n", hl);
            await message.channel.send(msgText);
            this.night(message);
        }
    }

    async htwkOnDie(player, callback) {
        let message = this.message;
        await message.channel.send(`Player ${player + 1} has a special ability on death! Player ${player + 1}, please respond in your own channel.`);
        const channel = await message.guild.channels.cache.find(x => x.name === `${String(player+1)}號`);
        const msg = await channel.send(`You can activate your ability and kill one player. Please choose the number of the player you would like to kill.`);
        let eArray = [];
        for(let i = 0; i < this.roles.length; i++){
            if(this.aliveRaw[i] && i !== player){
                eArray.push(intToEmoji.main(i));
            }
        }
        eArray.forEach(async e => await msg.react(e));
        log("Reacted to message and waiting for user input, hunter or wolf king");
        const collected = await msg.awaitReactions(
            async (r, u) => {
                if(u.bot || !eArray.includes(r.emoji.name)) return false;
                const member = await message.guild.members.fetch(u.id);
                let roles = member.roles.cache.array();
                for(let i = 0; i < roles.length; i++){
                    let role = roles[i];
                    if(role.name === "Dead" && role.name !== `${String(player+1)}號`){
                        log(`Spectator ${member.user.tag} attempted to use the hunter/wolf king death ability despite being dead. They attempted to kill ${emojiToAny(r.emoji.name)}`);
                        return false;
                    }else if(role.name === "MC" || role.name === "Developer" || role.name === `${String(player+1)}號`){
                        log(`${member.user.tag} made a decision as hunter or wolf king to kill ${emojiToAny(r.emoji.name)}`);
                        return true;
                    }
                }
                return false;
            },
            {max: 1}
        );
        await msg.reactions.removeAll();
        let killed = emojiToAny(collected.keyArray()[0]);
        log(`Hunter or wolf king chose to kill ${killed}`);
        await msg.channel.send(i18n("game-death-ability-killed", message.client.botLocale, String(killed+1)));
        this.kill(killed, message);
        await message.channel.send(`Player ${player + 1} has used their ability and killed player ${killed + 1}`);
        let endgStatus = this.checkIfEndgame();
        if(!endgStatus[0]){
            log(`Hunter or wolf king killed on death, endgame criteria not fulfilled, proceeding to check if killed player is hunter or wolf king.`);
            if(killed === this.hunter || killed === this.wolfk) {
                log(`Killed player is hunter or wolf king, recursion!`);
                this.htwkOnDie(killed, callback);
            }else {
                log(`Killed player is not hunter or wolf king, continue`);
                switch(callback){
                    case "vote":
                        this.vote(message);
                        break;
                    case "night":
                        this.night(message);
                        break;
                    default:
                        return log("unknown callback for htwkOnDie");
                }
            }
        }else{
            if(endgStatus[1]){
                log(`Hunter or wolf king killed on death, endgame criteria fulfilled, villager win, proceeding to endgame`);
                return endgame(message, i18n("game-vls", message.client.botLocale));
            }else{
                log(`Hunter or wolf king killed on death, endgame criteria fulfilled, wolf win, proceeding to endgame`);
                return endgame(message, i18n("game-wfs", message.client.botLocale));
            }
        }
    }
}