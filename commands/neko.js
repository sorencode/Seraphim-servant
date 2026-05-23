const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchPurrbot, fetchWaifu, fetchABD, fetchNekoBot } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('neko')
        .setDescription('Delivers a random NSFW neko Image/GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }


        const animeSources = [ { id: 'purrbot', endpoint: 'https://purrbot.site/api/img/nsfw/neko/gif' }, { id: 'purrbot', endpoint: 'https://purrbot.site/api/img/nsfw/neko/img' }, { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' }, { id: 'abd', endpoint: 'https://api.n-sfw.com/nsfw/neko' } ];
        const realSources = [ { id: 'nekobot', type: 'lewdneko' } ];

        const pool = [...animeSources, ...realSources];

        const sourceObj = pool[Math.floor(Math.random() * pool.length)];

        let imageData = null;

        if (sourceObj.id === 'purrbot') {
            logInfo(`[/neko] Selected API Source: Purrbot (${sourceObj.endpoint})`);
            imageData = await fetchPurrbot(sourceObj.endpoint);
        } else if (sourceObj.id === 'abd') {
            logInfo(`[/neko] Selected API Source: ABD (${sourceObj.endpoint})`);
            imageData = await fetchABD(sourceObj.endpoint);
        } else if (sourceObj.id === 'waifupics') {
            logInfo(`[/neko] Selected API Source: Waifu.pics (${sourceObj.endpoint})`);
            imageData = await fetchWaifu(sourceObj.endpoint);
        } else if (sourceObj.id === 'waifuim') {
            logInfo(`[/neko] Selected API Source: Waifu.im (tag: ${sourceObj.tag})`);
            imageData = await fetchWaifuIm(sourceObj.tag, true);
        } else if (sourceObj.id === 'oboobs') {
            logInfo(`[/neko] Selected API Source: Oboobs`);
            imageData = await fetchBoobs(null);
        } else if (sourceObj.id === 'obutts') {
            logInfo(`[/neko] Selected API Source: Obutts`);
            imageData = await fetchAss(null);
        } else if (sourceObj.id === 'nekobot') {
            logInfo(`[/neko] Selected API Source: NekoBot (type: ${sourceObj.type})`);
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
            .setTitle(`🔞 ▸ NSFW Neko Image`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const customIdBase = `refresh_neko`;

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
