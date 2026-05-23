const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logInfo, logError } = require('../utils/logger');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Advanced diagnostic metrics and latency check.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),

    async execute(interaction, isButton = false, page = 1) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        try {
            const client = interaction.client;
            const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

            logInfo(`[PING] Generating diagnostic data for Page ${page} (Requested by ${interaction.user.username})`);

            if (page === 1) {
                // Page 1: Latency & Response Metrics
                const pingTime = Date.now() - interaction.createdTimestamp;
                const apiLatency = Math.round(client.ws.ping);

                const embed = new EmbedBuilder()
                    .setTitle('🏓 ▸ Diagnostics: Latency Overview (Page 1/2)')
                    .setColor(`#${randomColor}`)
                    .setDescription('Core response times and websocket latency to Discord API.')
                    .addFields(
                        { name: '🔄 Roundtrip Latency', value: `\`${pingTime}ms\``, inline: true },
                        { name: '🌐 Websocket (API)', value: `\`${apiLatency}ms\``, inline: true }
                    )
                    .setFooter({
                        text: `${interaction.user.username} | Page 1 of 2 | Today at ${new Date().toLocaleTimeString()}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ping_page_2')
                            .setLabel('Next: System Specs ▶')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } else if (page === 2) {
                // Page 2: System Specs & Uptime Metrics
                const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
                const memoryData = process.memoryUsage();

                const uptime = process.uptime();
                const days = Math.floor(uptime / 86400);
                const hours = Math.floor(uptime / 3600) % 24;
                const minutes = Math.floor(uptime / 60) % 60;
                const seconds = Math.floor(uptime % 60);

                const embed = new EmbedBuilder()
                    .setTitle('🏓 ▸ Diagnostics: System Metrics (Page 2/2)')
                    .setColor(`#${randomColor}`)
                    .setDescription('Advanced host statistics and memory consumption.')
                    .addFields(
                        { name: '⏳ Uptime', value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``, inline: true },
                        { name: '💻 Process Memory', value: `\`${formatMemoryUsage(memoryData.rss)}\``, inline: true },
                        { name: '🏘️ Guild Count', value: `\`${client.guilds.cache.size}\``, inline: true },
                        { name: '⚙️ Host Platform', value: `\`${os.platform()} ${os.release()}\``, inline: false }
                    )
                    .setFooter({
                        text: `${interaction.user.username} | Page 2 of 2 | Today at ${new Date().toLocaleTimeString()}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ping_page_1')
                            .setLabel('◀ Back to Latency')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });
            }
        } catch (error) {
            logError(`[PING ERROR] Diagnostics failed: ${error.message}`);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription('An error occurred while running diagnostics.')
                .setColor('Red');
            await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }
    },
};
