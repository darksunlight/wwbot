module.exports = {
    name: 'sudo',
    su: true,
    cooldown: 0.1,
    description: '',
    execute(message, args) {
        const sumodule = require(`./sudo/${args[0]}`);
        args.shift();
        sumodule.execute(message, args);
	},
};
