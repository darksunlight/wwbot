module.exports = {
    name: 'vm',
    su: true,
    cooldown: 0.1,
    description: '',
    execute(message, args) {
        const vmodule = require("../../v86/module.js");
        vmodule.start(message);
	},
};
