const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, OAuth2Scopes, PermissionFlagsBits } = require('discord.js');
const { logInfo, logError } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get a dynamic invite link to add this bot to your server.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const client = interaction.client;
            const clientId = process.env.CLIENT_ID || client.user.id;

            // Calculate necessary permissions for full functionality
            const inviteUrl = client.generateInvite({
                scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
                permissions: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.UseExternalEmojis,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ViewChannel
                ]
            });

            const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

            const embed = new EmbedBuilder()
                .setTitle('✨ ▸ Invite Me to Your Server')
                .setDescription('Thank you for choosing to expand our premium NSFW image network. Click the button below to authorize the bot with the exact permissions needed for seamless functionality.')
                .setColor(`#${randomColor}`)
                .setFooter({
                    text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('➕ ▸ Invite Bot')
                        .setURL(inviteUrl)
                        .setStyle(ButtonStyle.Link)
                );

            logInfo(`[INVITE] User ${interaction.user.username} generated an invite link.`);
            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            logError(`[INVITE ERROR] Failed to generate invite link: ${error.message}`);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription('An error occurred while generating the invite link. Please contact support.')
                .setColor('Red');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
