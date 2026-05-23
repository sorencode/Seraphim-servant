const axios = require('axios');
const { logError, logInfo, logTimeout, logWarn } = require('./logger');
const db = require('./db');

const API_TIMEOUT = 15000;
const DOWNLOAD_TIMEOUT = 45000;
const REDGIF_API = 'https://api.redgifs.com/v2';
const MAX_SEEN_PER_TAG = 500;
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 8 * 1024 * 1024;  // 8 MB  — Discord hard limit for bots
const MIN_SD_SIZE   = 500 * 1024;       // 500 KB — below this = unacceptably low quality

let tempToken = null;
let tokenExpiry = 0;

async function getToken() {
    if (tempToken && Date.now() < tokenExpiry) return tempToken;
    try {
        const response = await axios.get(`${REDGIF_API}/auth/temporary`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: API_TIMEOUT
        });
        if (response.data && response.data.token) {
            tempToken = response.data.token;
            tokenExpiry = Date.now() + TOKEN_TTL_MS;
            logInfo('[RedGif] Refreshed temporary auth token');
            return tempToken;
        }
    } catch (error) {
        logError(`[RedGif] Failed to get auth token: ${error.message}`);
    }
    return null;
}

function getSeenKey(tag) {
    return `redgif_seen_${tag.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
}

function markAsSeen(tag, gifId) {
    const key = getSeenKey(tag);
    let seen = db.get(key) || [];
    if (!seen.includes(gifId)) {
        seen.push(gifId);
        if (seen.length > MAX_SEEN_PER_TAG) seen = seen.slice(-MAX_SEEN_PER_TAG);
        db.set(key, seen);
    }
}

function getSeenIds(tag) {
    return db.get(getSeenKey(tag)) || [];
}

function clearSeen(tag) {
    db.delete(getSeenKey(tag));
    logInfo(`[RedGif] Cleared seen history for tag: ${tag}`);
}

// Check remote file size via HEAD request (no download needed)
async function getRemoteSize(url) {
    if (!url) return Infinity;
    try {
        const response = await axios.head(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://www.redgifs.com/'
            },
            timeout: 8000
        });
        const len = response.headers['content-length'];
        return len ? parseInt(len, 10) : Infinity;
    } catch {
        return Infinity; // assume large if HEAD fails
    }
}

// Download a single URL as a buffer — returns Buffer or null
async function tryDownload(url) {
    if (!url) return null;
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: DOWNLOAD_TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://www.redgifs.com/'
            }
        });
        const buffer = Buffer.from(response.data);
        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        if (buffer.length > MAX_FILE_SIZE) {
            logWarn(`[RedGif] File too large to upload (${sizeMB}MB > 8MB)`);
            return null;
        }
        logInfo(`[RedGif] Downloaded video (${sizeMB}MB)`);
        return buffer;
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`[RedGif] Video download timed out: ${url}`);
        } else {
            logError(`[RedGif] Download error: ${error.message}`);
        }
        return null;
    }
}

/**
 * Smart download: prefers HD always. Falls back to SD only if it meets the
 * minimum quality threshold (≥ 500 KB). Low-quality SD files are rejected
 * so the caller can retry with a different GIF.
 */
async function downloadVideoBuffer(hdUrl, sdUrl) {
    // ── Step 1: always try HD first ───────────────────────────────────────────
    if (hdUrl) {
        const hdSize = await getRemoteSize(hdUrl);
        if (hdSize !== Infinity && hdSize <= MAX_FILE_SIZE) {
            logInfo(`[RedGif] HD size OK (${(hdSize / 1024 / 1024).toFixed(2)}MB) — downloading HD`);
            const buf = await tryDownload(hdUrl);
            if (buf) return buf;
        } else if (hdSize > MAX_FILE_SIZE) {
            logWarn(`[RedGif] HD too large (${(hdSize / 1024 / 1024).toFixed(2)}MB) — checking SD`);
        }
    }

    // ── Step 2: SD fallback — only if quality meets minimum threshold ─────────
    if (sdUrl && sdUrl !== hdUrl) {
        const sdSize = await getRemoteSize(sdUrl);

        if (sdSize !== Infinity && sdSize < MIN_SD_SIZE) {
            logWarn(`[RedGif] SD rejected — low quality (${(sdSize / 1024).toFixed(0)}KB < 500KB minimum) — try next GIF`);
            return null;
        }
        if (sdSize !== Infinity && sdSize <= MAX_FILE_SIZE) {
            logInfo(`[RedGif] SD size OK (${(sdSize / 1024 / 1024).toFixed(2)}MB) — downloading SD`);
            const buf = await tryDownload(sdUrl);
            if (buf) return buf;
        } else if (sdSize > MAX_FILE_SIZE) {
            logWarn(`[RedGif] SD also too large (${(sdSize / 1024 / 1024).toFixed(2)}MB) — skipping`);
        }
    }

    return null;
}

async function searchGifs(tag, page = 1) {
    const token = await getToken();
    if (!token) return null;
    const response = await axios.get(`${REDGIF_API}/gifs/search`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        params: { search_text: tag, order: 'trending', count: 40, page },
        timeout: API_TIMEOUT
    });
    if (!response.data || !response.data.gifs || response.data.gifs.length === 0) return null;
    return response.data.gifs;
}

/**
 * Fetch one GIF for a tag.
 * @param {string} tag
 * @param {string[]} excludeIds  Extra IDs to skip (used for retry logic in commands)
 */
async function fetchRedGif(tag, excludeIds = []) {
    try {
        const seenIds = getSeenIds(tag);
        const allExcluded = new Set([...seenIds, ...excludeIds]);

        const randomPage = Math.floor(Math.random() * 8) + 1;
        let gifs = await searchGifs(tag, randomPage);

        if (!gifs && randomPage > 1) {
            logWarn(`[RedGif] Page ${randomPage} empty for "${tag}", trying page 1`);
            gifs = await searchGifs(tag, 1);
        }
        if (!gifs) return null;

        const unseenGifs = gifs.filter(g => !allExcluded.has(g.id));
        const pool = unseenGifs.length > 0 ? unseenGifs : gifs.filter(g => !excludeIds.includes(g.id));
        if (unseenGifs.length === 0) {
            logWarn(`[RedGif] All gifs for "${tag}" already seen — cycling pool`);
        }
        if (pool.length === 0) {
            logWarn(`[RedGif] No eligible GIFs left for "${tag}" after exclusions`);
            return null;
        }

        const selected = pool[Math.floor(Math.random() * pool.length)];
        const urls = selected.urls || {};

        const hdUrl  = urls.hd  || null;
        const sdUrl  = urls.sd  || null;
        const bestUrl = hdUrl || sdUrl || urls.gif || null;

        if (!bestUrl) {
            logWarn(`[RedGif] No usable URL for gif "${selected.id}"`);
            return null;
        }

        markAsSeen(tag, selected.id);
        logInfo(`[RedGif] Selected "${selected.id}" for tag "${tag}" (${unseenGifs.length} unseen)`);

        return {
            id: selected.id,
            hdUrl,
            sdUrl,
            url: bestUrl,
            pageUrl: `https://www.redgifs.com/watch/${selected.id}`,
            likes:    selected.likes    || 0,
            views:    selected.views    || 0,
            duration: selected.duration ? Math.round(selected.duration) : 0,
            tags:     selected.tags     || [],
            isHd:     !!hdUrl
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`[RedGif] API timeout for tag "${tag}"`);
            return { error: 'TIMEOUT' };
        }
        logError(`[RedGif] Fetch failed for "${tag}": ${error.message}`);
        return null;
    }
}

// ─── Comprehensive RedGif Tag List ───────────────────────────────────────────
const REDGIF_TAGS = [
    'amateur', 'anal', 'asian', 'ass', 'bbc', 'bbw', 'bdsm', 'big ass',
    'big tits', 'bikini', 'blowjob', 'bondage', 'boobs', 'brunette',
    'butt', 'casting', 'cheating', 'college', 'compilation', 'cosplay',
    'creampie', 'cum', 'cumshot', 'cunnilingus', 'deepthroat', 'dildo',
    'double penetration', 'ebony', 'facial', 'feet', 'fingering', 'fisting',
    'flashing', 'french', 'fuck', 'gangbang', 'german', 'girlfriend',
    'groping', 'handjob', 'hardcore', 'homemade', 'humiliation',
    'interracial', 'japanese', 'jerk off', 'korean', 'latina', 'lesbian',
    'licking', 'lingerie', 'masturbation', 'milf', 'missionary', 'moaning',
    'natural tits', 'nipples', 'nude', 'nylon', 'office', 'oil',
    'orgasm', 'outdoor', 'petite', 'pov', 'pussy', 'pussy eating',
    'reality', 'riding', 'rough', 'russian', 'school', 'solo',
    'squirt', 'stockings', 'strip', 'swallow', 'tattoo', 'teacher',
    'teen', 'thai', 'threesome', 'tits', 'titty fuck', 'uniform',
    'vibrator', 'voyeur', 'webcam', 'white',
    'femboy', 'crossdresser', 'trap', 'sissy', 'transgender',
    'shemale', 'tgirl', 'ladyboy', 'futa', 'futanari',
    'hentai', 'ahegao', 'anime', 'ecchi', 'neko', 'maid', 'waifu',
    'tentacle', 'yuri', 'yaoi', 'paizuri', 'censored', 'uncensored',
    'blowjob hentai', 'hentai anal', 'hentai lesbian',
    'ballbusting', 'cbt', 'chastity', 'collar', 'cum eating',
    'cuckold', 'degradation', 'domination', 'edging', 'exhibitionism',
    'female domination', 'femdom', 'foot fetish', 'forced', 'latex',
    'leather', 'loli', 'male domination', 'mature', 'pee', 'pegging',
    'punishment', 'rimjob', 'slave', 'spit', 'strap on', 'submissive',
    'watersports', 'worship'
];

module.exports = { fetchRedGif, downloadVideoBuffer, clearSeen, REDGIF_TAGS };
