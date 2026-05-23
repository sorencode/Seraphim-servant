const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchABD, fetchWaifuIm } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('selfie')
        .setDescription('Delivers a random Selfie image'),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const sources = ['abd', 'waifuim'];
        const source = sources[Math.floor(Math.random() * sources.length)];

        let imageData = null;

        if (source === 'abd') {
            const endpoint = 'https://api.n-sfw.com/nsfw/selfie';
            logInfo(`[/selfie] Selected API Source: ABD (${endpoint})`);
            imageData = await fetchABD(endpoint);
        } else if (source === 'waifuim') {
            logInfo(`[/selfie] Selected API Source: Waifu.im (tag: selfies)`);
            imageData = await fetchWaifuIm('selfies', true);
        }

        if (!imageData || imageData.error) {
            let errorMsg = 'Failed to fetch image or no image found with that ID.';
            if (imageData && imageData.error === 'TIMEOUT') {
                errorMsg = 'API Timeout: The request took longer than 15 seconds to fulfill. Please try again later.';
            }
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription(errorMsg)
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle('🔞 ▸ NSFW Selfie Image')
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_selfie')
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('📎 ▸ Link')
                    .setURL(imageData.url)
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
