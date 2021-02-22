const log = require('../../utils/log.js');
module.exports = {
    name: 'serverbecome',
    execute(message, args) {
        const become = require(`./become/${args[0]}.js`);
        log(message.author.tag + " has become " + args[0]);
    },
};
