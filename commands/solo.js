const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchPurrbot, fetchABD } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solo')
        .setDescription('Delivers a random solo masturbation Image/GIF')
        .addStringOption(option =>
            option.setName('gender')
                .setDescription('The gender for the solo Image/GIF')
                .setRequired(false)
                .addChoices(
                    { name: 'Female', value: 'female' },
                    { name: 'Male', value: 'male' }
                )
        ),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        let originalGenderChoice = null;

        if (isButton) {
            // customId format: refresh_solo_{gender|random}
            const parts = interaction.customId.split('_');
            if (parts.length === 3 && parts[2] !== 'random') {
                originalGenderChoice = parts[2];
            }
        } else {
            originalGenderChoice = interaction.options?.getString('gender');
        }

        let fetchGender = originalGenderChoice;
        if (!fetchGender) {
            fetchGender = Math.random() < 0.5 ? 'female' : 'male';
        }

        let imageData = null;

        if (fetchGender === 'female') {
            const sources = ['purrbot', 'abd'];
            const source = sources[Math.floor(Math.random() * sources.length)];

            if (source === 'purrbot') {
                const endpoint = 'https://purrbot.site/api/img/nsfw/solo/gif';
                logInfo(`[/solo] Selected API Source: Purrbot Female (${endpoint})`);
                imageData = await fetchPurrbot(endpoint);
            } else if (source === 'abd') {
                const endpoint = 'https://api.n-sfw.com/nsfw/masturbation';
                logInfo(`[/solo] Selected API Source: ABD Masturbation (${endpoint})`);
                imageData = await fetchABD(endpoint);
            }
        } else {
            // Male only uses Purrbot
            const endpoint = 'https://purrbot.site/api/img/nsfw/solo_male/gif';
            logInfo(`[/solo] Selected API Source: Purrbot Male (${endpoint})`);
            imageData = await fetchPurrbot(endpoint);
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

        const embedTitleGender = fetchGender === 'female' ? 'Female' : 'Male';
        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW ${embedTitleGender} Solo Image`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const refreshId = `refresh_solo_${originalGenderChoice || 'random'}`;

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
