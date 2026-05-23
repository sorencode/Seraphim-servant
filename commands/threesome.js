const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchPurrbot } = require('../utils/api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('threesome')
        .setDescription('Delivers a random threesome GIF')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of threesome')
                .setRequired(false)
                .addChoices(
                    { name: '3 Females', value: 'fff' },
                    { name: '2 Females 1 Male', value: 'ffm' },
                    { name: '2 Males 1 Female', value: 'mmf' }
                )
        ),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        let originalTypeChoice = null;

        if (isButton) {
            // customId format: refresh_threesome_{type|random}
            const parts = interaction.customId.split('_');
            if (parts.length === 3 && parts[2] !== 'random') {
                originalTypeChoice = parts[2];
            }
        } else {
            originalTypeChoice = interaction.options?.getString('type');
        }

        let fetchType = originalTypeChoice;
        if (!fetchType) {
            const types = ['fff', 'ffm', 'mmf'];
            fetchType = types[Math.floor(Math.random() * types.length)];
        }

        const endpoint = `https://purrbot.site/api/img/nsfw/threesome_${fetchType}/gif`;

        const imageData = await fetchPurrbot(endpoint);

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

        let displayType = '';
        if (fetchType === 'fff') displayType = '3 Females';
        if (fetchType === 'ffm') displayType = '2 Females 1 Male';
        if (fetchType === 'mmf') displayType = '2 Males 1 Female';

        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW Threesome Image (${displayType})`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const refreshId = `refresh_threesome_${originalTypeChoice || 'random'}`;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(refreshId)
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
