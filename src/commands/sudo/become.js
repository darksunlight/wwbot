const log = require('../../utils/log.js');
module.exports = {
    name: 'become',
	execute(message, args) {
        if(args[0] === "0") return log(message.author.tag + " has ceased to become");
        let become;
        try{
            become = require(`./become/${args[0]}.js`);
        }catch(e){
            console.error(e);
        }
        if(typeof become === "undefined"){
            return message.reply("you have failed to become");
        }
        message.reply("you have become " + args[0]);
        log(message.author.tag + " has become " + args[0]);
	},
};
