const chalk = require('chalk');
module.exports = x => {
    let loggerDate = new Date();
    console.warn(chalk.blackBright(`[${loggerDate.toISOString()}]`), chalk.yellow(x));
}