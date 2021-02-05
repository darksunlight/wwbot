module.exports = {
    name: 'sudo',
    su: true,
    cooldown: 0.1,
	description: '',
	execute(message, args) {
		message.channel.send('Pong.');
	},
};
