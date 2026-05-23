const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { fetchNekoBest, fetchWaifu, fetchNekoBot, fetchSexcom } = require('../utils/api');
const { logInfo, logError } = require('../utils/logger');

// ── Action definitions ────────────────────────────────────────────────────────
const RP_DATA = {
    hug: {
        desc: 'Hug someone tightly!',
        emoji: '🤗',
        color: '#FF69B4',
        messages: [
            '💞 **{user}** runs up and hugs **{target}** as tight as possible!',
            '🫂 **{user}** wraps **{target}** in the warmest embrace~',
            '💕 **{user}** squeezes **{target}** and refuses to let go!',
            '🌸 **{user}** throws both arms around **{target}** lovingly!',
            '🥰 **{user}** dives in for an unexpected hug on **{target}**~',
        ],
        solo: [
            '🤗 **{user}** is sending free hugs to everyone!',
            '💖 **{user}** is spreading hug energy — catch one if you can!',
        ],
        sources: [
            { id: 'nekosbest', action: 'hug' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/hug' },
        ],
    },
    kiss: {
        desc: 'Give someone a sweet kiss!',
        emoji: '💋',
        color: '#FF1493',
        messages: [
            '💋 **{user}** leans in and softly kisses **{target}**~',
            '😘 **{user}** plants a warm kiss on **{target}**\'s cheek!',
            '💞 **{user}** gives **{target}** a long, lingering kiss!',
            '🌹 **{user}** steals a tender kiss from **{target}**~',
            '✨ **{user}** presses their lips gently against **{target}**\'s~',
        ],
        solo: [
            '💋 **{user}** blows a kiss to everyone in the room~',
            '😘 **{user}** is in the mood to kiss someone!',
        ],
        sources: [
            { id: 'nekosbest', action: 'kiss' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/kiss' },
        ],
    },
    pat: {
        desc: 'Pat someone on the head!',
        emoji: '✋',
        color: '#FFD700',
        messages: [
            '✋ **{user}** gently pats **{target}** on the head~',
            '😊 **{user}** gives **{target}** the most affectionate head pat!',
            '🌟 **{user}** ruffles **{target}**\'s hair lovingly!',
            '💫 **{user}** pats **{target}** with full parental energy~',
            '🤍 **{user}** gives **{target}** slow, calming head pats~',
        ],
        solo: [
            '✨ **{user}** is handing out pats — who wants one?',
            '🤚 **{user}** has the best pats in the server!',
        ],
        sources: [
            { id: 'nekosbest', action: 'pat' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/pat' },
        ],
    },
    cuddle: {
        desc: 'Cuddle up with someone!',
        emoji: '🥰',
        color: '#FFB6C1',
        messages: [
            '🥰 **{user}** snuggles up close to **{target}** and sighs~',
            '💤 **{user}** cuddles **{target}** and refuses to let go!',
            '🌙 **{user}** wraps around **{target}** like a cozy blanket~',
            '💖 **{user}** curls up next to **{target}** for warmth~',
            '🌸 **{user}** nuzzles into **{target}** and gets comfy~',
        ],
        solo: [
            '🥰 **{user}** is feeling extra cuddly today!',
            '💕 **{user}** wants to cuddle with someone — any takers?',
        ],
        sources: [
            { id: 'nekosbest', action: 'cuddle' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/cuddle' },
        ],
    },
    bite: {
        desc: 'Bite someone playfully!',
        emoji: '😈',
        color: '#8B0000',
        messages: [
            '😈 **{user}** sinks their teeth into **{target}**!',
            '🦷 **{user}** playfully chomps on **{target}**~',
            '😬 **{user}** gives **{target}** a sneaky bite on the neck!',
            '🌙 **{user}** bites **{target}** with surprising intensity~',
            '🖤 **{user}** nibbles on **{target}**\'s ear~',
        ],
        solo: [
            '😈 **{user}** is in a biting mood — nobody is safe!',
            '🦷 **{user}** snaps at the air... watching... waiting~',
        ],
        sources: [
            { id: 'nekosbest', action: 'bite' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/bite' },
        ],
    },
    lick: {
        desc: 'Lick someone!',
        emoji: '👅',
        color: '#FF69B4',
        messages: [
            '👅 **{user}** licks **{target}** completely out of nowhere!',
            '😋 **{user}** runs their tongue up **{target}**\'s cheek~',
            '😝 **{user}** gives **{target}** a big, sloppy lick!',
            '🌸 **{user}** traces a slow lick across **{target}**\'s neck~',
            '🔥 **{user}** licks **{target}** and smirks afterward~',
        ],
        solo: [
            '👅 **{user}** is licking the air — weird flex but ok!',
            '😋 **{user}** wants to lick someone, apparently!',
        ],
        sources: [
            { id: 'nekosbest', action: 'lick' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/lick' },
        ],
    },
    slap: {
        desc: 'Slap someone!',
        emoji: '👋',
        color: '#FF4500',
        messages: [
            '💥 **{user}** slaps **{target}** across the face without mercy!',
            '👋 **{user}** sends **{target}** spinning with a powerful slap!',
            '😤 **{user}** delivers a well-deserved slap to **{target}**!',
            '⚡ **{user}** slaps **{target}** so fast it echoes!',
            '🌊 **{user}** winds up and slaps **{target}** into next week!',
        ],
        solo: [
            '👋 **{user}** is slapping the air — someone wronged them!',
            '💢 **{user}** is feeling particularly slappy today!',
        ],
        sources: [
            { id: 'nekosbest', action: 'slap' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/slap' },
        ],
    },
    poke: {
        desc: 'Poke someone!',
        emoji: '👉',
        color: '#00BFFF',
        messages: [
            '👉 **{user}** pokes **{target}** in the cheek repeatedly~',
            '😂 **{user}** won\'t stop poking **{target}** no matter what!',
            '🫵 **{user}** jabs **{target}** with a single, annoying finger!',
            '✌️ **{user}** pokes **{target}** then pretends nothing happened!',
            '😏 **{user}** gives **{target}** a smug little poke~',
        ],
        solo: [
            '👉 **{user}** is poking everyone in sight!',
            '🫵 **{user}** raises a finger... and pokes the void~',
        ],
        sources: [
            { id: 'nekosbest', action: 'poke' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/poke' },
        ],
    },
    tickle: {
        desc: 'Tickle someone mercilessly!',
        emoji: '🤣',
        color: '#FFD700',
        messages: [
            '🤣 **{user}** tickles **{target}** without any mercy!',
            '😂 **{user}** goes straight for **{target}**\'s most ticklish spots!',
            '🌊 **{user}** unleashes a full tickle assault on **{target}**!',
            '🎭 **{user}** tickles **{target}** until they beg for air!',
            '⚡ **{user}** finds every weak spot **{target}** has!',
        ],
        solo: [
            '🤣 **{user}** is in tickle-monster mode — run!',
            '😈 **{user}** wiggles their fingers menacingly~',
        ],
        sources: [
            { id: 'nekosbest', action: 'tickle' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/tickle' },
        ],
    },
    blush: {
        desc: 'Blush at someone!',
        emoji: '😳',
        color: '#FF69B4',
        messages: [
            '😳 **{user}** blushes furiously the moment they look at **{target}**~',
            '🌹 **{user}** can\'t stop their face turning red because of **{target}**!',
            '💕 **{user}** goes completely crimson looking at **{target}**~',
            '🌸 **{user}** covers their face to hide the blush **{target}** caused!',
            '💓 **{user}**\'s heart skips a beat thanks to **{target}**~',
        ],
        solo: [
            '😳 **{user}** is blushing for absolutely no reason... right?',
            '🌹 **{user}**\'s face is as red as a tomato right now~',
        ],
        sources: [
            { id: 'nekosbest', action: 'blush' },
        ],
    },
    wave: {
        desc: 'Wave at someone!',
        emoji: '👋',
        color: '#00CED1',
        messages: [
            '👋 **{user}** waves cheerfully at **{target}**!',
            '🙌 **{user}** gives **{target}** a big, enthusiastic wave!',
            '😄 **{user}** spots **{target}** and waves from across the room~',
            '🌊 **{user}** flails their arms wildly waving at **{target}**!',
            '✨ **{user}** waves and beams a smile at **{target}**~',
        ],
        solo: [
            '👋 **{user}** waves at everyone — hi!',
            '😊 **{user}** is waving for attention~',
        ],
        sources: [
            { id: 'nekosbest', action: 'wave' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/wave' },
        ],
    },
    dance: {
        desc: 'Dance with or for someone!',
        emoji: '💃',
        color: '#9400D3',
        messages: [
            '💃 **{user}** pulls **{target}** onto the dance floor!',
            '🎵 **{user}** dances seductively right in front of **{target}**~',
            '🕺 **{user}** shows **{target}** their absolute best moves!',
            '✨ **{user}** spins gracefully and winks at **{target}**~',
            '🌟 **{user}** dances circles around a stunned **{target}**!',
        ],
        solo: [
            '💃 **{user}** starts dancing — nobody can stop them now!',
            '🎵 **{user}** is feeling the music and vibing hard~',
        ],
        sources: [
            { id: 'nekosbest', action: 'dance' },
        ],
    },
    handhold: {
        desc: 'Hold hands with someone!',
        emoji: '🤝',
        color: '#FF69B4',
        messages: [
            '🤝 **{user}** reaches out and gently takes **{target}**\'s hand~',
            '💕 **{user}** interlaces their fingers with **{target}** shyly!',
            '🌸 **{user}** and **{target}** walk side by side, hand in hand~',
            '💞 **{user}** squeezes **{target}**\'s hand softly~',
            '✨ **{user}** slips their hand into **{target}**\'s without a word~',
        ],
        solo: [
            '🤝 **{user}** reaches out their hand — anyone brave enough?',
            '💕 **{user}** wants to hold someone\'s hand right now~',
        ],
        sources: [
            { id: 'nekosbest', action: 'handhold' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/handhold' },
        ],
    },
    highfive: {
        desc: 'High five someone!',
        emoji: '🙌',
        color: '#FFD700',
        messages: [
            '🙌 **{user}** slaps hands with **{target}** in perfect sync!',
            '⚡ **{user}** and **{target}** share an absolutely legendary high five!',
            '🎉 **{user}** gives **{target}** the most satisfying high five!',
            '💥 **{user}** delivers a thunderous high five to **{target}**!',
            '🌟 **{user}** celebrates with **{target}** via a crispy high five!',
        ],
        solo: [
            '🙌 **{user}** raises a hand for a high five — don\'t leave them hanging!',
            '⚡ **{user}** is ready to celebrate with anyone!',
        ],
        sources: [
            { id: 'nekosbest', action: 'highfive' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/highfive' },
        ],
    },
    wink: {
        desc: 'Wink at someone flirtatiously!',
        emoji: '😉',
        color: '#FF69B4',
        messages: [
            '😉 **{user}** shoots **{target}** a slow, deliberate wink~',
            '😘 **{user}** winks at **{target}** and smiles secretly!',
            '✨ **{user}** gives **{target}** the most effortlessly charming wink~',
            '💫 **{user}** catches **{target}**\'s eye and winks flirtatiously!',
            '🌸 **{user}** winks at **{target}** and looks away innocently~',
        ],
        solo: [
            '😉 **{user}** winks at nobody in particular... or everyone?',
            '✨ **{user}** is in a very flirty mood right now~',
        ],
        sources: [
            { id: 'nekosbest', action: 'wink' },
        ],
    },
    spank: {
        desc: 'Spank someone!',
        emoji: '🔥',
        color: '#FF4500',
        messages: [
            '🔥 **{user}** gives **{target}** a firm, deliberate spank!',
            '💥 **{user}** smacks **{target}**\'s behind without warning!',
            '😈 **{user}** delivers a satisfying spank to **{target}**~',
            '⚡ **{user}** spanks **{target}** and raises an eyebrow~',
            '🖤 **{user}** makes sure **{target}** feels that one~',
        ],
        solo: [
            '🔥 **{user}** raises their hand... dominantly~',
            '😈 **{user}** is feeling very assertive today!',
        ],
        sources: [
            { id: 'sexcom', niche: 'spanking' },
            { id: 'nekobot', type: 'hentai' },
        ],
    },
    strip: {
        desc: 'Strip or do a striptease for someone!',
        emoji: '💃',
        color: '#FF1493',
        messages: [
            '💃 **{user}** starts an unexpected striptease for **{target}**~',
            '🔥 **{user}** slowly removes their clothes for **{target}**!',
            '😳 **{user}** does a seductive strip show right in front of **{target}**~',
            '💋 **{user}** puts on a private strip performance for **{target}**!',
            '✨ **{user}** undresses piece by piece, eyes locked on **{target}**~',
        ],
        solo: [
            '💃 **{user}** starts stripping — nobody asked but here we are!',
            '🔥 **{user}** does a private solo strip performance~',
        ],
        sources: [
            { id: 'sexcom', niche: 'strip tease' },
            { id: 'nekobot', type: 'hentai' },
        ],
    },
    seduce: {
        desc: 'Try to seduce someone!',
        emoji: '💋',
        color: '#8B0000',
        messages: [
            '💋 **{user}** turns on the full charm for **{target}**~',
            '😏 **{user}** leans close and whispers something that makes **{target}** nervous...',
            '🌹 **{user}** gazes into **{target}**\'s eyes with a dangerous look~',
            '✨ **{user}** brushes against **{target}** ever so lightly and smirks~',
            '🔥 **{user}** runs a finger along **{target}**\'s jawline seductively~',
        ],
        solo: [
            '💋 **{user}** is giving off dangerously seductive energy~',
            '😏 **{user}** has a certain look in their eyes... watch out~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
        ],
    },
    tease: {
        desc: 'Tease someone relentlessly!',
        emoji: '😝',
        color: '#FF69B4',
        messages: [
            '😝 **{user}** teases **{target}** until they can\'t take it anymore!',
            '😏 **{user}** toys with **{target}** with a wicked grin~',
            '🌶️ **{user}** pushes every single one of **{target}**\'s buttons!',
            '😈 **{user}** drives **{target}** absolutely crazy with teasing~',
            '🔥 **{user}** gets dangerously close to **{target}** then steps back~',
        ],
        solo: [
            '😝 **{user}** is in full-on tease mode today!',
            '😏 **{user}** is teasing absolutely everyone~',
        ],
        sources: [
            { id: 'sexcom', niche: 'tease' },
            { id: 'nekobot', type: 'hentai' },
        ],
    },
    moan: {
        desc: 'Let out a moan near someone!',
        emoji: '😮',
        color: '#FF1493',
        messages: [
            '😮 **{user}** lets out a soft, breathy moan next to **{target}**~',
            '😳 **{user}** moans loudly, making **{target}** freeze in place!',
            '💦 **{user}** makes a sound that makes **{target}** very nervous~',
            '🔥 **{user}** whispers a moan right into **{target}**\'s ear~',
            '🌙 **{user}** sighs deeply and gazes at **{target}**~',
        ],
        solo: [
            '😮 **{user}** moans... for no apparent reason whatsoever~',
            '🔥 **{user}** lets out a long sigh that says everything~',
        ],
        sources: [
            { id: 'sexcom', niche: 'moaning' },
            { id: 'nekobot', type: 'hentai' },
        ],
    },
    nuzzle: {
        desc: 'Nuzzle someone affectionately!',
        emoji: '🌸',
        color: '#FFB6C1',
        messages: [
            '🌸 **{user}** nuzzles their face into **{target}**\'s neck~',
            '💕 **{user}** rubs their nose against **{target}**\'s cheek affectionately!',
            '🥰 **{user}** nuzzles **{target}** and purrs softly~',
            '✨ **{user}** presses their face into **{target}** and sighs happily~',
            '🌙 **{user}** nuzzles **{target}** without saying a single word~',
        ],
        solo: [
            '🌸 **{user}** nuzzles the air... looking for someone to snuggle!',
            '🥰 **{user}** wants to nuzzle somebody right now~',
        ],
        sources: [
            { id: 'nekosbest', action: 'nuzzle' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/sfw/cuddle' },
        ],
    },
};

// ── Helper: fetch GIF with fallback chain ─────────────────────────────────────
async function fetchRpGif(sources, actionName) {
    for (const src of sources) {
        let data = null;
        try {
            if (src.id === 'nekosbest')  data = await fetchNekoBest(src.action);
            else if (src.id === 'waifupics') data = await fetchWaifu(src.endpoint);
            else if (src.id === 'nekobot')   data = await fetchNekoBot(src.type);
            else if (src.id === 'sexcom')    data = await fetchSexcom(src.niche);
        } catch (_) {}
        if (data && !data.error && data.url) {
            logInfo(`[/rp ${actionName}] Source OK: ${src.id}`);
            return data;
        }
    }
    return null;
}

// ── Helper: pick random message ───────────────────────────────────────────────
function pickMsg(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildMsg(template, user, target) {
    return template.replace(/{user}/g, user).replace(/{target}/g, target || 'everyone');
}

// ── Build SlashCommand with all subcommands ───────────────────────────────────
const builder = new SlashCommandBuilder()
    .setName('rp')
    .setDescription('Real roleplay — actions, emotions, and more!')
    .setNSFW(true)
    .setIntegrationTypes(0)
    .setContexts(0);

for (const [name, cfg] of Object.entries(RP_DATA)) {
    builder.addSubcommand(sub =>
        sub.setName(name)
            .setDescription(cfg.desc)
            .addUserOption(opt =>
                opt.setName('target')
                    .setDescription('Who is the target of this action? (optional)')
                    .setRequired(false)
            )
    );
}

// ── Module export ─────────────────────────────────────────────────────────────
module.exports = {
    data: builder,
    async execute(interaction, isButton = false, subAction = null) {
        const action = isButton ? subAction : interaction.options.getSubcommand();
        const cfg = RP_DATA[action];

        if (!cfg) {
            return isButton
                ? null
                : interaction.reply({ content: '❌ Unknown RP action.', ephemeral: true });
        }

        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const target = !isButton ? interaction.options.getUser('target') : null;
        const userName  = `**${interaction.user.username}**`;
        const targetName = target ? `**${target.username}**` : null;

        const template = targetName ? pickMsg(cfg.messages) : pickMsg(cfg.solo);
        const description = buildMsg(template, userName, targetName);

        const imageData = await fetchRpGif(cfg.sources, action);

        const embed = new EmbedBuilder()
            .setTitle(`${cfg.emoji} ▸ Roleplay — ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .setDescription(description)
            .setColor(cfg.color)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        if (imageData && imageData.url) {
            embed.setImage(imageData.url);
        } else {
            embed.setDescription(description + '\n\n*⚠️ GIF unavailable right now — action still counts!*');
        }

        const refreshId = `refresh_rp_${action}`;

        const components = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(refreshId)
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                ...(imageData && imageData.url ? [
                    new ButtonBuilder()
                        .setLabel('📎 ▸ Link')
                        .setURL(imageData.url)
                        .setStyle(ButtonStyle.Link),
                ] : []),
            ),
        ];

        await interaction.editReply({ embeds: [embed], components });
    },
};
