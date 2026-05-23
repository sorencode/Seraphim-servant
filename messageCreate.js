const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logInfo, logError } = require('../utils/logger');
const chalk = require('chalk');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const client = message.client;
        const mentionRegex = new RegExp(`^<@!?${client.user.id}>$`);

        if (mentionRegex.test(message.content.trim())) {
            logInfo(chalk.magenta(`[IDENTITY MENTION] Triggered by ${message.author.username} in ${message.guild?.name || 'DM'}`));

            try {
                const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

                const embed = new EmbedBuilder()
                    .setTitle(`✨ ▸ Welcome to ${client.user.username}`)
                    .setDescription(`I am a high-end, premium NSFW image delivery network.\n\nType \`/help\` to browse my massive directory of categories and specialties, or use the buttons below to explore my core features instantly.`)
                    .setColor(`#${randomColor}`)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setFooter({
                        text: `Requested by ${message.author.username} | Today at ${new Date().toLocaleTimeString()}`,
                        iconURL: message.author.displayAvatarURL()
                    });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('intro_features')
                            .setLabel('🔍 ▸ Core Features')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('intro_support')
                            .setLabel('🛠️ ▸ Support & Usage')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await message.reply({ embeds: [embed], components: [row] });
            } catch (error) {
                logError(chalk.red(`[MENTION ERROR] Failed to send intro embed: ${error.message}`));
            }
        }
    },
};
