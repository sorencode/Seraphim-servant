const axios = require('axios');
const https = require('https');
const dns = require('dns');
const chalk = require('chalk');
const { logError, logWarn, logInfo, logTimeout } = require('./logger');

const API_TIMEOUT = 15000;

async function fetchBoobs(id = null) {
    try {
        let endpoint = 'http://api.oboobs.ru/boobs/0/1/random/';
        if (id !== null && !isNaN(id)) {
            endpoint = `http://api.oboobs.ru/boobs/get/${id}/`;
        }

        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || response.data.length === 0) {
            return null;
        }

        const imageData = response.data[0];
        const imageUrl = `http://media.oboobs.ru/${imageData.preview}`;

        return {
            id: imageData.id,
            url: imageUrl
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to oboobs.ru exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from oboobs.ru: ${error.message}`);
        return null;
    }
}

async function fetchAss(id = null) {
    try {
        let endpoint = 'http://api.obutts.ru/butts/0/1/random/';
        if (id !== null && !isNaN(id)) {
            endpoint = `http://api.obutts.ru/butts/get/${id}/`;
        }

        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || response.data.length === 0) {
            return null;
        }

        const imageData = response.data[0];
        const imageUrl = `http://media.obutts.ru/${imageData.preview}`;

        return {
            id: imageData.id,
            url: imageUrl
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to obutts.ru exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from obutts.ru: ${error.message}`);
        return null;
    }
}

async function fetchPurrbot(endpoint) {
    try {
        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || response.data.error || !response.data.link) {
            return null;
        }

        return {
            url: response.data.link
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to purrbot.site exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from purrbot.site: ${error.message}`);
        return null;
    }
}

async function fetchWaifu(endpoint) {
    try {
        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || !response.data.url) {
            return null;
        }

        return {
            url: response.data.url
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to waifu.pics exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from waifu.pics: ${error.message}`);
        return null;
    }
}

async function fetchABD(endpoint) {
    try {
        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data) {
            return null;
        }

        let targetUrl = response.data.url_japan;
        let fieldUsed = 'url_japan';

        if (!targetUrl) {
            logWarn(`url_japan missing, falling back to url_usa`);
            targetUrl = response.data.url_usa;
            fieldUsed = 'url_usa';
        }

        if (!targetUrl) {
            return null;
        }

        logInfo(`[fetchABD] Successfully extracted image using field: ${fieldUsed}`);

        return {
            url: targetUrl
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to n-sfw.com (ABD) exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from n-sfw.com (ABD): ${error.message}`);
        return null;
    }
}

async function fetchWaifuIm(tag, isNsfw = true) {
    try {
        const response = await axios.get('https://api.waifu.im/images', {
            params: {
                IncludedTags: tag,
                IsNsfw: isNsfw ? 'True' : 'False'
            },
            headers: {
                'Authorization': `ApiKey ${process.env.WAIFU_IM_KEY}`,
                'Accept-Version': 'v7'
            },
            timeout: API_TIMEOUT
        });

        if (!response.data || !response.data.items || response.data.items.length === 0) {
            return null;
        }

        return {
            url: response.data.items[0].url
        };
    } catch (error) {
        if (error.response && error.response.status === 401) {
            logError('[AUTH ERROR] Waifu.im Key is invalid or expired');
            return null;
        }
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to waifu.im exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from waifu.im: ${error.message}`);
        return null;
    }
}

async function fetchSexcom(niche) {
    try {
        // sex.com provides pages of results, fetch a random page from top 10 for variety
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await axios.get('https://www.sex.com/portal/api/gifs/search', {
            headers: {
                // Must mock a user-agent to bypass 400 errors
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            params: {
                'sexual-orientation': 'straight',
                'order': 'likeCount',
                'search': niche,
                'page': randomPage,
                'limit': 40
            },
            timeout: API_TIMEOUT
        });
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            return null;
        }
        const items = response.data.data;
        const randomItem = items[Math.floor(Math.random() * items.length)];
        let urlPath = randomItem.uri;
        if (!urlPath) {
            return null;
        }
        // Native display of animated GIFs requirement:
        // Convert the webp thumbnail path to gif
        if (urlPath.endsWith('.webp')) {
            urlPath = urlPath.slice(0, -5) + '.gif';
        }
        // Map the root URL domain for the CDN as per the Python extractor
        const targetUrl = 'https://imagex1.sx.cdn.live' + urlPath;
        return {
            id: randomItem.id,
            url: targetUrl
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to sex.com exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from sex.com: ${error.message}`);
        return null;
    }
}

async function resolveIP(hostname) {
    return new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address) => {
            if (err) reject(err);
            else resolve(address);
        });
    });
}

async function fetchNekoBot(type) {
    try {
        const response = await axios.get(`https://nekobot.xyz/api/image?type=${type}`, {
            headers: {
                'Authorization': '015445535454455354D6'
            },
            timeout: API_TIMEOUT
        });

        if (!response.data || !response.data.success || !response.data.message) {
            return null;
        }

        return {
            url: response.data.message,
            source: 'nekobot'
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to nekobot.xyz exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from nekobot.xyz: ${error.message}`);
        return null;
    }
}

async function fetchPorngifs() {
    let finalBuffer = null;
    let randomId = null;
    let targetUrl = null;
    let retries = 0;
    let resolvedIP = null;

    try {
        resolvedIP = await resolveIP('porngifs.com');
    } catch (err) {
        logError(`[DNS] Failed to resolve porngifs.com IP: ${err.message}`);
        return null;
    }

    const httpsAgent = new https.Agent({
        servername: 'cdn.porngifs.com' // SNI bypass
    });

    while (!finalBuffer && retries < 15) {
        randomId = Math.floor(Math.random() * 39239) + 1;
        targetUrl = `https://cdn.porngifs.com/img/${randomId}`;

        // DNS Bypass: Connect directly to the IP but spoof the Host header
        const bypassUrl = `https://${resolvedIP}/img/${randomId}`;

        try {
            const response = await axios.get(bypassUrl, {
                responseType: 'arraybuffer',
                httpsAgent: httpsAgent,
                headers: {
                    'Host': 'cdn.porngifs.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Referer': 'https://porngifs.com/',
                    'Accept': 'image/*'
                },
                timeout: API_TIMEOUT
            });

            if (response.status === 200 && response.data) {
                const tempBuffer = Buffer.from(response.data, 'binary');
                if (tempBuffer.length <= 8 * 1024 * 1024 && tempBuffer.length > 1024) {
                    finalBuffer = tempBuffer;
                    console.log(chalk.cyan(`[DNS BYPASS] Successfully fetched Pin ID ${randomId} from IP ${resolvedIP}`));
                } else {
                    logWarn(`[Porngifs] Skipped file (ID: ${randomId}) due to Discord 8MB size limit (${(tempBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
                    retries++;
                }
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                logTimeout(`Request to porngifs.com exceeded 15 seconds during retry ${retries + 1}.`);
            }
            retries++;
        }
    }

    if (!finalBuffer) {
        logError(`[Porngifs] Failed to fetch a valid, embed-safe image after 15 retries.`);
        return null;
    }

    return {
        id: randomId.toString(),
        url: targetUrl,
        source: 'porngifs',
        buffer: finalBuffer
    };
}

async function fetchNekoBest(action) {
    try {
        const response = await axios.get(`https://nekos.best/api/v2/${action}`, { timeout: API_TIMEOUT });
        if (!response.data || !response.data.results || response.data.results.length === 0) return null;
        return { url: response.data.results[0].url };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to nekos.best exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from nekos.best (${action}): ${error.message}`);
        return null;
    }
}

module.exports = {
    fetchBoobs,
    fetchAss,
    fetchPurrbot,
    fetchWaifu,
    fetchABD,
    fetchWaifuIm,
    fetchSexcom,
    fetchPorngifs,
    fetchNekoBot,
    fetchNekoBest
};
