const { Events, EmbedBuilder } = require('discord.js');
const { logCommand, logError, logWarn } = require('../utils/logger');

const ALLOWED_GUILD_ID = '1243347347967049802';

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isAutocomplete() && !interaction.isModalSubmit()) return;

        // Block usage outside the allowed server
        if (interaction.guild && interaction.guild.id !== ALLOWED_GUILD_ID) {
            logWarn(`[Security] Blocked interaction from unauthorized guild: ${interaction.guild.name} (${interaction.guild.id})`);
            try {
                if (interaction.isAutocomplete()) return;
                await interaction.reply({
                    content: '❌ This bot is private and only available in its home server.',
                    ephemeral: true
                });
            } catch (_) {}
            return;
        }

        // Shared NSFW verification check logic
        const checkNSFW = (interact) => {
            const commandName = interact.commandName || (interact.customId ? interact.customId.split('_')[1] : null);
            const safeCommands = ['help', 'invite', 'ping', 'intro'];

            // Allow safe commands everywhere, bypass in DMs
            if (safeCommands.includes(commandName) || safeCommands.some(c => interact.customId && interact.customId.startsWith(c))) return true;
            if (!interact.guild) return true;

            if (!interact.channel.nsfw) {
                const nsfwEmbed = new EmbedBuilder()
                    .setTitle('❌ ▸ Not NSFW channel')
                    .setDescription('This command can only be used in NSFW channels. Please use this command in a channel marked as NSFW.')
                    .setColor('Red')
                    .setFooter({
                        text: `${interact.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                        iconURL: interact.user.displayAvatarURL()
                    });

                interact.reply({ embeds: [nsfwEmbed], ephemeral: true });
                return false;
            }
            return true;
        };

        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                if (command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                logError(`Error executing autocomplete for ${interaction.commandName}: ${error}`);
            }
        } else if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logError(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            // Log command execution
            logCommand(
                interaction.commandName,
                interaction.user.username,
                interaction.user.id,
                interaction.guild?.name || 'DM',
                interaction.guild?.id || 'DM'
            );

            if (!checkNSFW(interaction)) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                logError(`Error executing command ${interaction.commandName}: ${error}`);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                } catch (innerError) {
                    logError(`Failed to send error message to Discord: ${innerError.message}`);
                }
            }
        } else if (interaction.isButton()) {
            if (!checkNSFW(interaction)) return;

            const customId = interaction.customId;

            try {
                if (customId.startsWith('refresh_')) {
                    const parts = customId.split('_');
                    const commandName = parts[1];
                    const filterOption = parts.slice(2).join('_').replace(/_/g, ' ');

                    const command = client.commands.get(commandName);
                    if (command) await command.execute(interaction, true, filterOption);
                } else if (customId.startsWith('help_page_') || customId.startsWith('help_command_') || customId.startsWith('help_search_modal_btn')) {
                    const command = client.commands.get('help');
                    if (command) await command.execute(interaction, true);
                } else if (customId.startsWith('ping_page_')) {
                    const command = client.commands.get('ping');
                    const targetPage = parseInt(customId.split('_')[2], 10);
                    if (command) await command.execute(interaction, true, targetPage);
                } else if (customId.startsWith('intro_')) {
                    const isFeatures = customId === 'intro_features';
                    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

                    const title = isFeatures ? '🔍 ▸ Core Features' : '🛠️ ▸ Support & Usage';
                    const description = isFeatures
                        ? '• **Massive Multi-API Network**: Scrapes from 7 major backends (`n-sfw.com`, `purrbot`, `oboobs`, `waifu.im`, etc.)\n• **Dynamic Help System**: Run `/help` to use our fuzzy-search modal to locate the exact category you need.\n• **Native Discord Media**: Auto-converts WebP animations into native MP4/GIFs for inline chat playback.'
                        : '• **Global Access**: Works seamlessly in DMs and NSFW-marked Guild channels.\n• **Invite**: Type `/invite` to generate an OAuth2 link with precisely calculated permissions.\n• **Performance**: Type `/ping` to see advanced diagnostic memory readouts and latency metrics.';

                    const ephemeralEmbed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(description)
                        .setColor(`#${randomColor}`);

                    await interaction.reply({ embeds: [ephemeralEmbed], ephemeral: true });
                }
            } catch (error) {
                logError(`Error executing button action ${customId}: ${error}`);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error executing this interaction!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this interaction!', ephemeral: true });
                    }
                } catch (innerError) {
                    logError(`Failed to send error message to Discord for button: ${innerError.message}`);
                }
            }
        } else if (interaction.isModalSubmit()) {
            if (!checkNSFW(interaction)) return;
            const customId = interaction.customId;
            try {
                if (customId.startsWith('help_search_modal')) {
                    const command = client.commands.get('help');
                    if (command) await command.execute(interaction, false, true);
                }
            } catch (error) {
                logError(`Error executing modal submit ${customId}: ${error}`);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error executing this interaction!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this interaction!', ephemeral: true });
                    }
                } catch (innerError) {
                    logError(`Failed to send error message to Discord for modal: ${innerError.message}`);
                }
            }
        }
    },
};
