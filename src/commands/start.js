const log = require('../utils/log.js');
const Game = require('../classes/Game.js');
const i18n = require('../i18n.js');

module.exports = {
    name: 'start',
    permissions: 'MANAGE_ROLES',
    cooldown: 1,
    args: true,
    usage: '<code>',
	description: "cmd-start-desc",
	execute(message, args) {
        if(message.client.game!=null){
            if(!message.client.game.ended){
                log(message.author.tag + " attempted to start a game with code " + args[0] + " but failed due to: A game is currently in progress.");
                return message.channel.send("A game is currently in progress. Please wait for the current game to end before starting a new one.");
            }
        }
        const game = new Game(message.client, args[0]);
        message.client.game = game;
        game.start(message);
	},
};
