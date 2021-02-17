const prefix = "!";
const i18n = require('../i18n.js');
const log = require('../utils/log.js');

module.exports = {
	name: 'help',
	description: "cmd-help-desc",
	aliases: ['commands', 'man'],
	usage: '[command name]',
	cooldown: 1,
	execute(message, args) {
		const data = [];
        const { commands } = message.client;
        if (!args.length) {
            data.push('Here\'s a list of all my commands:');
            data.push(commands.map(command => command.name).join(', '));
            data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);

            return message.author.send(data, { split: true })
	            .then(() => {
		            if (message.channel.type === 'dm') return;
		            message.reply('I\'ve sent you a DM with all my commands!');
	            })
	            .catch(error => {
		            console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
		            message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
	            });
        }
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
        	// return message.reply('that\'s not a valid command!');
            return message.channel.send(i18n("cmd-help-invalid-cmd", message.client.botLocale, message.author.id)).then(_=>log(message.author.tag + " used !help to get info about command " + name + " but failed because " + name + " is not a valid command."));
        }

        // data.push(`**Name:** ${command.name}`);
        data.push(i18n("cmd-help-name", message.client.botLocale, command.name));

        if (command.aliases) data.push(i18n("cmd-help-aliases", message.client.botLocale, command.aliases.join(i18n("comma-separator", message.client.botLocale)), command.aliases.length));
        if (command.description) data.push(i18n("cmd-help-desc-string", message.client.botLocale, i18n(command.description, message.client.botLocale)));
        // if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
        if (command.usage) data.push(i18n("cmd-help-usage", message.client.botLocale, prefix.concat(command.name, " ", command.usage)));

        // data.push(`**Cooldown:** ${command.cooldown || 1} second(s)`);
        data.push(i18n("cmd-help-cooldown", message.client.botLocale, i18n("seconds", message.client.botLocale, command.cooldown || 1)))

        message.channel.send(data, { split: true }).then(_=>log(message.author.tag + " used !help to get info about command " + name));

	},
};