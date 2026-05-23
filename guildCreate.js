const { Events } = require('discord.js');
const { logInfo, logWarn } = require('../utils/logger');

const ALLOWED_GUILD_ID = '1243347347967049802';

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        if (guild.id !== ALLOWED_GUILD_ID) {
            logWarn(`[Security] Joined unauthorized guild "${guild.name}" (${guild.id}) — leaving immediately.`);
            await guild.leave();
            logInfo(`[Security] Successfully left unauthorized guild "${guild.name}".`);
        } else {
            logInfo(`[Security] Joined the authorized guild "${guild.name}" (${guild.id}).`);
        }
    },
};
