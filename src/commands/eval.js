const log = require('../utils/log.js');
const success = require('../utils/success.js');
const warn = require('../utils/warn.js');
module.exports = {
    name: 'eval',
    su: true,
    cooldown: 0.1,
    description: '',
    execute(message, args) {
        let result;
        try{
            result = Function(`"use strict";return ${args.join(' ')}`)();
        }catch(e){
            return message.channel.send(`${e.name}: ${e.message}`);
        }
        result = result.replace(/[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/, "NoTokenForYou");
        if(result !== "" && typeof result !== "undefined") return message.channel.send(result);
	},
};
