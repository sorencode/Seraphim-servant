const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { logSuccess, logError, logInfo } = require('../utils/logger');

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const globalCommands = [];
    const guildCommands = [];
    const TESTING_GUILD_ID = process.env.TESTING_GUILD_ID || null;

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);

                if (command.testOnly) {
                    guildCommands.push(command.data.toJSON());
                    logSuccess(`Loaded Guild Command: ${file}`);
                } else {
                    globalCommands.push(command.data.toJSON());
                    logSuccess(`Loaded Global Command: ${file}`);
                }
            } else {
                logError(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        } catch (error) {
            logError(`Failed to load command ${file}: ${error.message}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

    try {
        logInfo('Started refreshing application (/) commands.');

        // Register Global Commands
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: globalCommands },
        );
        logSuccess(`Successfully reloaded ${globalCommands.length} global application (/) commands.`);

        // Register Guild Commands
        if (TESTING_GUILD_ID && guildCommands.length > 0) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, TESTING_GUILD_ID),
                { body: guildCommands },
            );
            logSuccess(`Successfully reloaded ${guildCommands.length} guild-specific application (/) commands.`);
        } else if (!TESTING_GUILD_ID && guildCommands.length > 0) {
            logWarn(`Found ${guildCommands.length} guild-specific (testOnly) commands, but no TESTING_GUILD_ID environment variable is set. Skipping guild registration.`);
        }

    } catch (error) {
        logError(`Failed to reload application (/) commands: ${error.message}`);
    }
};
