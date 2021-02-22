const log = require('../../utils/log.js');
module.exports = {
    name: 'setlocale',
    execute(message, args) {
        message.client.botLocale = args[0];
        message.channel.send(`Bot locale set to ${args[0]}`).then(_=>log(message.author.tag + " set bot locale to " + args[0]));
    },
};
