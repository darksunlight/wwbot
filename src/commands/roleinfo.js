const log = require('../utils/log.js');
const Role = require('../classes/Role.js');

module.exports = {
    name: 'roleinfo',
    cooldown: 1,
    args: true,
    usage: '<role code>',
    description: "cmd-roleinfo-desc",
    execute(message, args) {
        const role = new Role(args[0], message.client.botLocale);
        if(!role.isValid){
            return message.channel.send(`That role code is invalid. `);
        }
        message.channel.send(`Information about the role "${role.name}": \n${role.desc}`);
    },
};
