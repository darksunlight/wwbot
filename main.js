require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const log = require('./src/utils/log.js');

const fs = require('fs');
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./src/commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}
const prefix = "!";
const cooldowns = new Discord.Collection();

client.on('ready', () => {
    log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.author.bot) return;
    const content = msg.content;
    if (content.startsWith(prefix)) {
        if(msg.channel.type === "dm") {
            return msg.channel.send("Commands cannot be used in DMs.");
        }
        if(msg.guild.id!="653535903511216129"){
            return msg.channel.send("WWBot has been disabled on this server.");
        }
        const args = msg.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;
        if (command.su) {
            if(msg.author.id !== "531822031059288074") return msg.reply("you do not have permission to use this command.");
        }
        if (command.permissions) {
            const authorPerms = msg.channel.permissionsFor(msg.author);
            if (!authorPerms || !authorPerms.has(command.permissions)) {
                return msg.reply('you do not have permission to use this command.');
            }
        }

        if (command.args && !args.length) {
            let reply = `You didn't provide any arguments, ${msg.author}!`;
            if (command.usage) {
                reply += `\nThe proper usage is: \`${prefix}${command.name} ${command.usage}\``;
            }
            return msg.channel.send(reply);
        }

        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }
        
        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 1) * 1000;
        
        if (timestamps.has(msg.author.id)) {
            const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;
        
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return msg.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
            }
        }        
        timestamps.set(msg.author.id, now);
        setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

        try {
            log(msg.author.tag + " used " + prefix + commandName);
            command.execute(msg, args);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login();