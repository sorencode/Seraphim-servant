const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder
} = require('discord.js');
const { fetchRedGif, downloadVideoBuffer } = require('./redgif');
const { logInfo, logError, logWarn } = require('./logger');
const db = require('./db');

const DB_KEY = 'redgif_auto_configs';
const activeJobs = new Map(); // key → intervalId

function getConfigs() { return db.get(DB_KEY) || {}; }
function saveConfigs(c) { db.set(DB_KEY, c); }
function jobKey(guildId, channelId) { return `${guildId}_${channelId}`; }

// Increment post count and return true if the job should stop (limit reached)
function incrementAndCheck(guildId, channelId) {
    const configs = getConfigs();
    const key = jobKey(guildId, channelId);
    const cfg = configs[key];
    if (!cfg) return false;

    cfg.postCount = (cfg.postCount || 0) + 1;
    saveConfigs(configs);

    if (cfg.maxPosts > 0 && cfg.postCount >= cfg.maxPosts) return true;
    return false;
}

async function runAutoPost(client, guildId, channelId, tag) {
    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            logWarn(`[RedGif Auto] Channel ${channelId} not found — stopping`);
            stopJob(guildId, channelId);
            removeConfig(guildId, channelId);
            return;
        }

        const gifData = await fetchRedGif(tag);
        if (!gifData || gifData.error) {
            logWarn(`[RedGif Auto] Fetch failed for tag "${tag}" in ${channelId}`);
            return;
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const durationStr = gifData.duration > 0 ? `${gifData.duration}s` : 'N/A';

        // Check post limit
        const limitReached = incrementAndCheck(guildId, channelId);

        // Read updated count for footer
        const configs = getConfigs();
        const cfg = configs[jobKey(guildId, channelId)];
        const countStr = cfg && cfg.maxPosts > 0
            ? `${cfg.postCount}/${cfg.maxPosts}`
            : `#${(cfg?.postCount || 1)}`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🔗 ▸ RedGif Page')
                .setURL(gifData.pageUrl)
                .setStyle(ButtonStyle.Link)
        );

        // ── Strategy 1: upload real MP4 file (HD → SD fallback) ─────────────
        const videoBuffer = await downloadVideoBuffer(gifData.hdUrl, gifData.sdUrl);

        const embed = new EmbedBuilder()
            .setTitle(`🤖 ▸ Auto Post — ${tag.charAt(0).toUpperCase() + tag.slice(1)}`)
            .setColor(`#${randomColor}`)
            .addFields(
                { name: '🏷️ Tag',      value: `\`${tag}\``,                   inline: true },
                { name: '⏱️ Duration', value: durationStr,                    inline: true },
                { name: '❤️ Likes',    value: gifData.likes.toLocaleString(), inline: true },
                { name: '👁️ Views',    value: gifData.views.toLocaleString(), inline: true }
            )
            .setFooter({ text: `RedGif Auto-Post • Anti-repeat • Post ${countStr}` });

        if (videoBuffer) {
            const attachment = new AttachmentBuilder(videoBuffer, { name: `${gifData.id}.mp4` });
            await channel.send({ files: [attachment], embeds: [embed], components: [row] });
            logInfo(`[RedGif Auto] MP4 posted — tag "${tag}" → ${channelId} (post ${countStr})`);
        } else {
            // ── Strategy 2: OGP page URL (Discord renders as video preview) ──
            logWarn(`[RedGif Auto] Upload failed for "${gifData.id}" — using OGP URL`);
            embed.setDescription(
                `🏷️ \`${tag}\` • ⏱️ ${durationStr} • ❤️ ${gifData.likes.toLocaleString()} • 👁️ ${gifData.views.toLocaleString()}`
            );
            await channel.send({ content: gifData.pageUrl, embeds: [embed], components: [row] });
            logInfo(`[RedGif Auto] OGP URL posted — tag "${tag}" → ${channelId} (post ${countStr})`);
        }

        // ── Auto-stop when limit reached ─────────────────────────────────────
        if (limitReached) {
            stopJob(guildId, channelId);
            removeConfig(guildId, channelId);
            logInfo(`[RedGif Auto] Max posts reached — job stopped for ${channelId}`);

            const doneEmbed = new EmbedBuilder()
                .setTitle('✅ ▸ Auto-Post Complete')
                .setDescription(`Reached the post limit for tag \`${tag}\`.\nUse \`/redgifauto start\` to run again.`)
                .setColor('Green')
                .setFooter({ text: `RedGif Auto-Post • Limit reached` });

            await channel.send({ embeds: [doneEmbed] });
        }
    } catch (error) {
        logError(`[RedGif Auto] Error posting to ${channelId}: ${error.message}`);
    }
}

function startJob(client, guildId, channelId, tag, intervalSeconds) {
    const key = jobKey(guildId, channelId);

    if (activeJobs.has(key)) {
        clearInterval(activeJobs.get(key));
        activeJobs.delete(key);
    }

    const intervalMs = intervalSeconds * 1000;
    runAutoPost(client, guildId, channelId, tag);
    const id = setInterval(() => runAutoPost(client, guildId, channelId, tag), intervalMs);
    activeJobs.set(key, id);
    logInfo(`[RedGif Auto] Job started — tag: "${tag}", every ${intervalSeconds}s, channel: ${channelId}`);
}

function stopJob(guildId, channelId) {
    const key = jobKey(guildId, channelId);
    if (activeJobs.has(key)) {
        clearInterval(activeJobs.get(key));
        activeJobs.delete(key);
        logInfo(`[RedGif Auto] Job stopped — channel ${channelId}`);
        return true;
    }
    return false;
}

function addConfig(guildId, channelId, tag, intervalSeconds, maxPosts, addedBy) {
    const configs = getConfigs();
    const key = jobKey(guildId, channelId);
    configs[key] = {
        guildId, channelId, tag,
        intervalSeconds,
        maxPosts: maxPosts || 0,   // 0 = unlimited
        postCount: 0,
        addedBy,
        addedAt: Date.now()
    };
    saveConfigs(configs);
}

function removeConfig(guildId, channelId) {
    const configs = getConfigs();
    const key = jobKey(guildId, channelId);
    if (configs[key]) {
        delete configs[key];
        saveConfigs(configs);
        return true;
    }
    return false;
}

function getGuildConfigs(guildId) {
    return Object.values(getConfigs()).filter(c => c.guildId === guildId);
}

function isRunning(guildId, channelId) {
    return activeJobs.has(jobKey(guildId, channelId));
}

async function initAll(client) {
    const entries = Object.values(getConfigs());
    if (entries.length === 0) {
        logInfo('[RedGif Auto] No saved jobs to restore.');
        return;
    }
    logInfo(`[RedGif Auto] Restoring ${entries.length} job(s)...`);
    for (const cfg of entries) {
        const { guildId, channelId, tag } = cfg;
        // Backward-compat with old intervalMinutes schema
        const secs = cfg.intervalSeconds ?? (cfg.intervalMinutes ? cfg.intervalMinutes * 60 : 60);
        // Skip jobs that already hit their max
        if (cfg.maxPosts > 0 && (cfg.postCount || 0) >= cfg.maxPosts) {
            logInfo(`[RedGif Auto] Skipping completed job for channel ${channelId}`);
            continue;
        }
        try {
            startJob(client, guildId, channelId, tag, secs);
        } catch (err) {
            logError(`[RedGif Auto] Failed to restore job for ${channelId}: ${err.message}`);
        }
    }
}

module.exports = { initAll, startJob, stopJob, addConfig, removeConfig, getGuildConfigs, isRunning };
