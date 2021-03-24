const chalk = require('chalk');
module.exports = (x, s) => {
    let loggerDate = new Date();
    console.warn(chalk.blackBright(`[${loggerDate.toISOString()}]`), chalk.green(x));
}