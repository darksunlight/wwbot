const log = require('../utils/log.js');
const Code = require('../classes/Code.js');
const Role = require('../classes/Role.js');

module.exports = {
    name: 'codeinfo',
    disabled: true,
    cooldown: 1,
    args: true,
    usage: '<role code>',
    description: 'Get info about a game code',
    execute(message, args) {
        const role = new Role(args[0]);
        if(!role.isValid){
            return message.channel.send(`That game code is invalid. `);
        }
        message.channel.send(`Information about the code "${role.name}": \n${role.desc}`);
    },
};
