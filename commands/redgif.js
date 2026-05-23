const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    MessageFlags
} = require('discord.js');
const { fetchRedGif, downloadVideoBuffer, REDGIF_TAGS } = require('../utils/redgif');
const { logInfo, logWarn } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redgif')
        .setDescription('🎬 Fetch a high-quality video from RedGif by tag')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true)
        .addStringOption(option =>
            option
                .setName('tag')
                .setDescription('Content tag (e.g. femboy, hentai, amateur...)')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const filtered = REDGIF_TAGS
            .filter(tag => tag.toLowerCase().includes(focused))
            .slice(0, 25);
        await interaction.respond(
            filtered.map(tag => ({
                name: tag.charAt(0).toUpperCase() + tag.slice(1),
                value: tag
            }))
        );
    },

    async execute(interaction, isButton = false, tagOverride = null) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const tag = tagOverride || interaction.options?.getString('tag') || 'amateur';
        logInfo(`[/redgif] Fetching tag: "${tag}" for ${interaction.user.username}`);

        // ── Retry loop: up to 3 GIFs until one passes quality check ──────────
        const MAX_RETRIES = 3;
        const triedIds = [];
        let gifData = null;
        let videoBuffer = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            gifData = await fetchRedGif(tag, triedIds);
            if (!gifData || gifData.error) break;

            triedIds.push(gifData.id);
            videoBuffer = await downloadVideoBuffer(gifData.hdUrl, gifData.sdUrl);
            if (videoBuffer) {
                logInfo(`[/redgif] Quality OK on attempt ${attempt} — "${gifData.id}"`);
                break;
            }
            logWarn(`[/redgif] Attempt ${attempt} rejected (low quality / too large) — retrying`);
        }

        if (!gifData || gifData.error) {
            let errorMsg = '⚠️ No results found for that tag. Try a different one!';
            if (gifData && gifData.error === 'TIMEOUT') {
                errorMsg = '⏱️ RedGif API timed out. Please try again.';
            }
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ RedGif Error')
                .setDescription(errorMsg)
                .setColor('Red')
                .setFooter({
                    text: `${interaction.user.username} | Tag: ${tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const durationStr = gifData.duration > 0 ? `${gifData.duration}s` : 'N/A';
        const safeTag = tag.replace(/\s+/g, '_');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`refresh_redgif_${safeTag}`)
                    .setLabel('🔄 ▸ New Video')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('🔗 ▸ RedGif Page')
                    .setURL(gifData.pageUrl)
                    .setStyle(ButtonStyle.Link)
            );

        const metaEmbed = new EmbedBuilder()
            .setColor(`#${randomColor}`)
            .addFields(
                { name: '🏷️ Tag',      value: `\`${tag}\``,                   inline: true },
                { name: '⏱️ Duration', value: durationStr,                    inline: true },
                { name: '❤️ Likes',    value: gifData.likes.toLocaleString(), inline: true },
                { name: '👁️ Views',    value: gifData.views.toLocaleString(), inline: true }
            )
            .setFooter({
                text: `${interaction.user.username} | RedGif • HD-first • Anti-repeat`,
                iconURL: interaction.user.displayAvatarURL()
            });

        // ── Strategy 1: upload MP4 (HD preferred, quality-gated SD fallback) ─
        if (videoBuffer) {
            const attachment = new AttachmentBuilder(videoBuffer, { name: `${gifData.id}.mp4` });
            metaEmbed.setTitle(`🎬 ▸ RedGif — ${tag.charAt(0).toUpperCase() + tag.slice(1)}`);
            return await interaction.editReply({
                files: [attachment],
                embeds: [metaEmbed],
                components: [row]
            });
        }

        // ── Strategy 2: OGP page URL fallback (all retries exhausted) ────────
        logWarn(`[/redgif] All ${MAX_RETRIES} attempts exhausted — using OGP fallback`);
        metaEmbed
            .setTitle(`🎬 ▸ RedGif — ${tag.charAt(0).toUpperCase() + tag.slice(1)}`)
            .setDescription(`🏷️ \`${tag}\` • ⏱️ ${durationStr} • ❤️ ${gifData.likes.toLocaleString()} • 👁️ ${gifData.views.toLocaleString()}`);

        await interaction.editReply({
            content: gifData.pageUrl,
            embeds: [metaEmbed],
            components: [row]
        });
    }
};
