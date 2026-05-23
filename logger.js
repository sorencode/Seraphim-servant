const chalk = require('chalk');

function logHeader(botName) {
    console.log(chalk.bold.magenta('========================================='));
    console.log(chalk.bold.magenta(`=       ${chalk.cyan(botName)} is online!      =`));
    console.log(chalk.bold.magenta('========================================='));
}

function logSuccess(message) {
    console.log(`${chalk.bold.green('[SUCCESS]')} ${message}`);
}

function logInfo(message) {
    console.log(`${chalk.cyan('[INFO]')} ${message}`);
}

function logWarn(message) {
    console.warn(`${chalk.bold.yellow('[WARN]')} ${message}`);
}

function logError(message) {
    console.error(`${chalk.bold.red('[ERROR]')} ${message}`);
}

function logTimeout(message) {
    console.error(`${chalk.bold.red('[TIMEOUT]')} ${message}`);
}

function logCommand(commandName, username, userId, guildName, guildId) {
    const cmd = chalk.bold.yellow(`/${commandName}`);
    const user = chalk.blue(username);
    const uId = chalk.gray(`(${userId})`);
    const guild = chalk.green(guildName);
    const gId = chalk.gray(`(${guildId})`);

    console.log(`${chalk.magenta('[COMMAND]')} ${user} ${uId} executed ${cmd} in ${guild} ${gId}`);
}

module.exports = {
    logHeader,
    logSuccess,
    logInfo,
    logWarn,
    logError,
    logTimeout,
    logCommand
};
