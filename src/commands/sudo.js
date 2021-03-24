module.exports = {
    name: 'sudo',
    su: true,
    cooldown: 0.1,
    description: '',
    execute(message, args) {
        args[0] = args[0].replace(/\.\./g, "");
        const sumodule = require(`./sudo/${args[0]}`);
        args.shift();
        sumodule.execute(message, args);
	},
};
