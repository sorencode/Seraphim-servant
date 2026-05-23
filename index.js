const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { logError, logInfo, logWarn } = require('./utils/logger');
const eventHandler = require('./handler/events');
const http = require('http');

// ── Keepalive HTTP server (required for 24/7 hosting on Replit) ──────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', bot: 'Seraphim Servant', uptime: process.uptime() }));
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logWarn(`[Keepalive] Port ${PORT} already in use — skipping HTTP server`);
    } else {
        logError(`[Keepalive] Server error: ${err.message}`);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    logInfo(`[Keepalive] HTTP server listening on port ${PORT}`);
});

// ── Initialize Discord Client ─────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});

client.commands = new Collection();

logInfo('Initializing handlers...');
eventHandler(client);

// ── Login ─────────────────────────────────────────────────────────────────────
if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID) {
    logError('Missing BOT_TOKEN or CLIENT_ID environment variables.');
    process.exit(1);
}

client.login(process.env.BOT_TOKEN).catch(err => {
    logError(`Login failed: ${err.message}`);
});
