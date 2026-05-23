const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { fetchSexcom, fetchPorngifs, fetchNekoBot } = require('../utils/api');
const { logInfo } = require('../utils/logger');

const NICHES = [
    'Amateur', 'Anal', 'Asian', 'Big Tits', 'Blonde', 'Blowjob', 'Brunette', 'Creampie', 'Cumshot', 'Hardcore', 'Latina', 'Lesbian', 'MILF', 'Masturbation', 'Threesome',
    'Ass', 'BBW', 'BDSM', 'Double Penetration', 'Ebony', 'Female Ejaculation', 'Fisting', 'Footjob', 'Gangbang', 'Hairy', 'Handjob', 'Hentai', 'Lingerie', 'Public Sex', 'Pussy', 'Toys'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Delivers a random NSFW GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        let imageData = null;
        let watchUrl = null;

        // Randomly pick a source: 0 = Sex.com, 1 = Porngifs.com, 2 = NekoBot (pgif)
        const sourcePick = Math.floor(Math.random() * 3);

        if (sourcePick === 0) {
            const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
            logInfo(`[/gif] Selected API Source: Sex.com (niche: ${niche})`);
            imageData = await fetchSexcom(niche);
            if (imageData && imageData.id) {
                watchUrl = `https://www.sex.com/pin/${imageData.id}/`;
                logInfo(`[/gif] Fetched GIF - Pin ID: ${imageData.id}`);
            }
        } else if (sourcePick === 1) {
            logInfo(`[/gif] Selected API Source: Porngifs.com`);
            imageData = await fetchPorngifs();
            if (imageData && imageData.id) {
                watchUrl = imageData.url;
                logInfo(`[/gif] Fetched GIF - Src ID: ${imageData.id}`);
            }
        } else {
            logInfo(`[/gif] Selected API Source: NekoBot (type: pgif)`);
            imageData = await fetchNekoBot('pgif');
            if (imageData && imageData.url) {
                watchUrl = imageData.url;
            }
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

        let attachment = null;
        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW GIF`)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        if (imageData.buffer) {
            // Buffer supplied: build local attachment with explicit MIME masking
            attachment = new AttachmentBuilder(imageData.buffer, { name: 'animation.gif' });
            embed.setImage('attachment://animation.gif');
        } else {
            // URL supplied: standard remote image mapping
            embed.setImage(imageData.url);
        }

        const customIdBase = 'refresh_gif';

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(customIdBase)
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('📎 ▸ Link')
                    .setURL(watchUrl)
                    .setStyle(ButtonStyle.Link)
            );

        const replyPayload = {
            embeds: [embed],
            components: [row],
            files: attachment ? [attachment] : []
        };

        await interaction.editReply(replyPayload);
    },
};
