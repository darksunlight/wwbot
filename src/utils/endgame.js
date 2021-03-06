const log = require("./log.js");
const i18n = require("../i18n.js");
module.exports = (message, side, forceful = false) => {
    const wdc = message.guild.channels.cache.find(x => x.name === "狼人");
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
            if(forceful){
                log(message.author.tag + " forcefully ended a game with code " + message.client.game.code.code);
                return message.channel.send("Successfully ended game with game code " + message.client.game.code.code);
            }else{
                log(`Game ended in ${message.guild.name}`);
                return message.channel.send(i18n("game-end-message", message.client.botLocale, side));
            }
        }
    }
    return message.channel.send("There are no active games at the moment.");
}