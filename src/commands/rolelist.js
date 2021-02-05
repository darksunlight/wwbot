const log = require('../utils/log.js');

module.exports = {
    name: 'rolelist',
    cooldown: 5,
	description: 'Output a list of roles',
	execute(message, args) {
        if(message.client.game!=null){
            if(!message.client.game.ended){
                if(message.channel.name!="spectators"){
                    log(message.author.tag + " attempted to start a game with code " + args[0] + " but failed due to: A game is currently in progress.");
                    return message.channel.send("A game is currently in progress. You have to wait for the current game to end to see the role list.");
                }
            }
            message.channel.send(message.client.game.rolelist);
        }else{
            message.channel.send("<@" + message.author.id +">, no WWE games started after the bot reconnected! Fetching list from another source...").then(msg=>{
                message.guild.channels.cache.find(x => x.name === "bot-roles").messages
                    .fetch({limit: 1})
                    .then(messages => {message.channel.send(messages.first().content); msg.edit(`<@${message.author.id}>, done!`);})
                    .catch(console.error)
            });
        }
	},
};
