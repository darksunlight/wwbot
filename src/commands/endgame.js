const log = require('../utils/log.js');
const Discord = require('discord.js');
module.exports = {
    name: 'endgame',
    permissions: 'MANAGE_ROLES',
    cooldown: 1,
    description: 'Forces the current game to end',
    
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     */
	execute(message, args) {
        const wdc = message.guild.channels.cache.find(x => x.name === "狼人討論");
        for(let i=0; i<12; i++){
            wdc.updateOverwrite(
                message.guild.roles.cache.find(n => n.name === String(i+1)+'號'),
                { 'VIEW_CHANNEL': false, 'SEND_MESSAGES': false }
            );
        }
        message.guild.members.cache.forEach(member => member.roles.remove(message.guild.roles.cache.find(x=>x.name==="Dead")));
        if(message.client.game!=null){
            if(message.client.game.ended){
                return message.channel.send("There are no active games at the moment.");
            }else{
                message.client.game.ended = true;
                log(message.author.tag + " forcefully ended a game with code " + message.client.game.code.code);
                return message.channel.send("Successfully ended game with game code " + message.client.game.code.code);
            }
        }
        return message.channel.send("There are no active games at the moment.");
	},
};
