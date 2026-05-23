const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags
} = require('discord.js');
const { REDGIF_TAGS } = require('../utils/redgif');
const autoManager = require('../utils/redgifAutoManager');
const { logInfo } = require('../utils/logger');

const MIN_INTERVAL = 1;
const MAX_INTERVAL = 86400; // 24 h in seconds

function formatSeconds(s) {
    if (s < 60)   return `${s}s`;
    if (s < 3600) { const m = Math.floor(s/60), r = s%60; return r ? `${m}m ${r}s` : `${m}m`; }
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
    return m ? `${h}h ${m}m` : `${h}h`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redgifauto')
        .setDescription('🤖 Manage automatic RedGif video posting')
        .setNSFW(true)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

        // ── start ─────────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('start')
            .setDescription('▶ Start auto-posting RedGif videos in a channel')
            .addStringOption(o => o
                .setName('tag')
                .setDescription('Content tag (e.g. femboy, hentai, amateur...)')
                .setRequired(true)
                .setAutocomplete(true))
            .addIntegerOption(o => o
                .setName('interval')
                .setDescription('Seconds between each post (1 = every second, 3600 = every hour)')
                .setRequired(true)
                .setMinValue(MIN_INTERVAL)
                .setMaxValue(MAX_INTERVAL))
            .addIntegerOption(o => o
                .setName('max_posts')
                .setDescription('Max videos to post then auto-stop (0 or leave empty = unlimited)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(10000))
            .addChannelOption(o => o
                .setName('channel')
                .setDescription('Target NSFW channel (defaults to current channel)')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText))
        )

        // ── stop ──────────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('stop')
            .setDescription('⏹ Stop auto-posting in a channel')
            .addChannelOption(o => o
                .setName('channel')
                .setDescription('Channel to stop (defaults to current channel)')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText))
        )

        // ── status ────────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('📋 List all active auto-post jobs in this server')
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const filtered = REDGIF_TAGS.filter(t => t.toLowerCase().includes(focused)).slice(0, 25);
        await interaction.respond(filtered.map(t => ({
            name: t.charAt(0).toUpperCase() + t.slice(1),
            value: t
        })));
    },

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({
                content: '❌ This command can only be used inside a server.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const sub       = interaction.options.getSubcommand();
        const guildId   = interaction.guild.id;
        const rndColor  = () => Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        // ══ start ═════════════════════════════════════════════════════════════
        if (sub === 'start') {
            const tag             = interaction.options.getString('tag');
            const intervalSeconds = interaction.options.getInteger('interval');
            const maxPosts        = interaction.options.getInteger('max_posts') ?? 0;
            const targetChannel   = interaction.options.getChannel('channel') || interaction.channel;

            if (!targetChannel.nsfw) {
                return await interaction.editReply({ embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ ▸ Not an NSFW Channel')
                        .setDescription(`<#${targetChannel.id}> must be marked NSFW.`)
                        .setColor('Red')
                ] });
            }

            autoManager.addConfig(guildId, targetChannel.id, tag, intervalSeconds, maxPosts, interaction.user.id);
            autoManager.startJob(interaction.client, guildId, targetChannel.id, tag, intervalSeconds);

            logInfo(`[/redgifauto start] "${tag}" every ${intervalSeconds}s, max ${maxPosts || '∞'} → #${targetChannel.name}`);

            const limitLine = maxPosts > 0
                ? `\n🔢 **Max Posts:** ${maxPosts} (auto-stops after ${maxPosts} videos)`
                : '\n♾️ **Max Posts:** Unlimited';

            return await interaction.editReply({ embeds: [
                new EmbedBuilder()
                    .setTitle('✅ ▸ Auto-Post Started')
                    .setDescription(`RedGif auto-posting is **active** in <#${targetChannel.id}>!${limitLine}`)
                    .addFields(
                        { name: '🏷️ Tag',      value: `\`${tag}\``,                        inline: true },
                        { name: '⏱️ Every',    value: formatSeconds(intervalSeconds),       inline: true },
                        { name: '📺 Channel',  value: `<#${targetChannel.id}>`,             inline: true }
                    )
                    .setColor(`#${rndColor()}`)
                    .setFooter({
                        text: `Started by ${interaction.user.username} • /redgifauto stop to cancel`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
            ] });
        }

        // ══ stop ══════════════════════════════════════════════════════════════
        if (sub === 'stop') {
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
            const wasRunning    = autoManager.stopJob(guildId, targetChannel.id);
            autoManager.removeConfig(guildId, targetChannel.id);

            if (!wasRunning) {
                return await interaction.editReply({ embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ ▸ No Active Job')
                        .setDescription(`No active auto-post in <#${targetChannel.id}>.`)
                        .setColor('Yellow')
                ] });
            }

            return await interaction.editReply({ embeds: [
                new EmbedBuilder()
                    .setTitle('⏹️ ▸ Auto-Post Stopped')
                    .setDescription(`Auto-posting stopped in <#${targetChannel.id}>.`)
                    .setColor('Orange')
                    .setFooter({ text: `Stopped by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            ] });
        }

        // ══ status ════════════════════════════════════════════════════════════
        if (sub === 'status') {
            const configs = autoManager.getGuildConfigs(guildId);

            if (configs.length === 0) {
                return await interaction.editReply({ embeds: [
                    new EmbedBuilder()
                        .setTitle('📋 ▸ Auto-Post Status')
                        .setDescription('No active jobs.\nUse `/redgifauto start` to create one!')
                        .setColor('Grey')
                ] });
            }

            const fields = configs.map((cfg, i) => {
                const isActive = autoManager.isRunning(guildId, cfg.channelId);
                const secs     = cfg.intervalSeconds ?? (cfg.intervalMinutes ? cfg.intervalMinutes * 60 : 60);
                const progress = cfg.maxPosts > 0
                    ? `${cfg.postCount || 0}/${cfg.maxPosts}`
                    : `${cfg.postCount || 0} (unlimited)`;
                const since    = new Date(cfg.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                return {
                    name: `${i + 1}. <#${cfg.channelId}>`,
                    value: [
                        `🏷️ Tag: \`${cfg.tag}\``,
                        `⏱️ Every: **${formatSeconds(secs)}**`,
                        `📊 Posts: **${progress}**`,
                        `${isActive ? '🟢 Running' : '🔴 Stopped'}`,
                        `📅 Since: ${since}`
                    ].join('\n'),
                    inline: false
                };
            });

            return await interaction.editReply({ embeds: [
                new EmbedBuilder()
                    .setTitle('📋 ▸ Auto-Post Status')
                    .setDescription(`**${configs.length}** job(s) in this server.`)
                    .addFields(fields)
                    .setColor(`#${rndColor()}`)
                    .setFooter({ text: `Use /redgifauto stop to cancel a job` })
            ] });
        }
    }
};
