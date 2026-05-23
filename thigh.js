const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchNekoBot } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thigh')
        .setDescription('Delivers a random NSFW thigh Image/GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true)
        .addStringOption(option =>
            option.setName('style')
                .setDescription('Select the style (Anime or Real)')
                .setRequired(false)
                .addChoices(
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Real', value: 'Real' }
                )
        ),
    async execute(interaction, isButton = false, savedStyle = null) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const style = savedStyle || (interaction.options ? interaction.options.getString('style') : null);
        const animeSources = [ { id: 'nekobot', type: 'hthigh' } ];
        const realSources = [ { id: 'nekobot', type: 'thigh' } ];

        let pool = [];
        if (style === 'Anime') {
            pool = animeSources;
        } else if (style === 'Real') {
            pool = realSources;
        } else {
            pool = [...animeSources, ...realSources];
        }

        if (pool.length === 0) pool = [...animeSources, ...realSources];

        const sourceObj = pool[Math.floor(Math.random() * pool.length)];

        let imageData = null;

        if (sourceObj.id === 'purrbot') {
            logInfo(`[/thigh] Selected API Source: Purrbot (${sourceObj.endpoint})`);
            imageData = await fetchPurrbot(sourceObj.endpoint);
        } else if (sourceObj.id === 'abd') {
            logInfo(`[/thigh] Selected API Source: ABD (${sourceObj.endpoint})`);
            imageData = await fetchABD(sourceObj.endpoint);
        } else if (sourceObj.id === 'waifupics') {
            logInfo(`[/thigh] Selected API Source: Waifu.pics (${sourceObj.endpoint})`);
            imageData = await fetchWaifu(sourceObj.endpoint);
        } else if (sourceObj.id === 'waifuim') {
            logInfo(`[/thigh] Selected API Source: Waifu.im (tag: ${sourceObj.tag})`);
            imageData = await fetchWaifuIm(sourceObj.tag, true);
        } else if (sourceObj.id === 'oboobs') {
            logInfo(`[/thigh] Selected API Source: Oboobs`);
            imageData = await fetchBoobs(null);
        } else if (sourceObj.id === 'obutts') {
            logInfo(`[/thigh] Selected API Source: Obutts`);
            imageData = await fetchAss(null);
        } else if (sourceObj.id === 'nekobot') {
            logInfo(`[/thigh] Selected API Source: NekoBot (type: ${sourceObj.type})`);
            imageData = await fetchNekoBot(sourceObj.type);
        }

        if (!imageData || imageData.error) {
            let errorMsg = 'Failed to fetch image.';
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
            .setTitle(`🔞 ▸ NSFW Thigh Image`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const customIdBase = style ? `refresh_thigh_${style}` : `refresh_thigh`;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(customIdBase)
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
