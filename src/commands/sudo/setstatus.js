const log = require('../../utils/log.js');
module.exports = {
    name: 'setstatus',
	execute(message, args) {
        const type = args[0];
        args.shift();
        message.client.user.setActivity(args.join(" "), { type: type });
        log(message.author.tag + " set bot status to " + type + " " + args.join(" "));
	},
};
