const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { fetchPurrbot, fetchWaifu, fetchNekoBot, fetchWaifuIm, fetchNekoBest } = require('../utils/api');
const { logInfo, logError } = require('../utils/logger');

// ── Hentai RP action definitions ──────────────────────────────────────────────
const HRP_DATA = {
    neko: {
        desc: 'Neko roleplay — catlike charm and playfulness!',
        emoji: '🐱',
        color: '#FF69B4',
        messages: [
            '🐱 **{user}** pounces on **{target}**, ears flat and tail swishing~',
            '😺 **{user}** curls up on **{target}**\'s lap, purring loudly~',
            '🐾 **{user}** rubs their head against **{target}** and meows softly~',
            '✨ **{user}** stares at **{target}** with big, hungry cat eyes~',
            '🌙 **{user}** arches their back and stretches playfully in front of **{target}**~',
        ],
        solo: [
            '🐱 **{user}** goes full neko mode — ears up, tail wagging!',
            '😺 **{user}** meows and paws at the air cutely~',
        ],
        sources: [
            { id: 'purrbot', endpoint: 'https://purrbot.site/api/img/nsfw/neko/gif' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
            { id: 'nekobot', type: 'lewdneko' },
        ],
    },
    maid: {
        desc: 'Maid roleplay — "Is there anything I can do for you?"',
        emoji: '🧹',
        color: '#FFB6C1',
        messages: [
            '🧹 **{user}** curtsies gracefully before **{target}**: *"Your wish is my command~"*',
            '💕 **{user}** leans over **{target}** with a coy smile: *"Shall I serve you personally?"*',
            '🌸 **{user}** adjusts their apron and whispers to **{target}**: *"I live to please~"*',
            '✨ **{user}** sets down a tray and gazes at **{target}**: *"Anything else, Master?"*',
            '🎀 **{user}** smooths their skirt and approaches **{target}** with a blush~',
        ],
        solo: [
            '🧹 **{user}** dons a maid outfit and awaits orders~',
            '💕 **{user}** is in full maid mode — who will they serve?',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
            { id: 'waifuim', tag: 'maid', nsfw: true },
        ],
    },
    succubus: {
        desc: 'Succubus roleplay — dark, seductive, and dangerous!',
        emoji: '😈',
        color: '#8B0000',
        messages: [
            '😈 **{user}** spreads their dark wings and smiles hungrily at **{target}**~',
            '🌹 **{user}** circles **{target}** slowly, tail swaying: *"You smell delicious..."*',
            '🔥 **{user}** leans close to **{target}** and breathes in their ear~',
            '🖤 **{user}** presses a clawed finger under **{target}**\'s chin seductively~',
            '✨ **{user}** locks eyes with **{target}**: *"Don\'t worry... it only hurts a little~"*',
        ],
        solo: [
            '😈 **{user}** transforms into a succubus — everyone is prey now!',
            '🌙 **{user}** floats menacingly, scanning the room for a target~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    yandere: {
        desc: 'Yandere roleplay — obsessive, possessive, and unpredictable!',
        emoji: '🔪',
        color: '#FF1493',
        messages: [
            '🔪 **{user}** grabs **{target}** tightly: *"You\'re mine. Only mine. Forever."*',
            '💕 **{user}** hugs **{target}** from behind, squeezing hard: *"Don\'t ever leave me~"*',
            '😱 **{user}** stares at **{target}** with a disturbing smile: *"I\'ve been watching you~"*',
            '🌸 **{user}** traces a finger across **{target}**\'s cheek: *"So beautiful... just for me."*',
            '🖤 **{user}** whispers into **{target}**\'s ear: *"No one else can have you~"*',
        ],
        solo: [
            '🔪 **{user}** smiles sweetly with a wild look in their eyes~',
            '💕 **{user}** is feeling *very* possessive right now... who\'s the unlucky one?',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    catgirl: {
        desc: 'Catgirl roleplay — fluffy ears, soft paws, dangerous claws!',
        emoji: '🐾',
        color: '#FFD700',
        messages: [
            '🐾 **{user}** rubs their fluffy ears against **{target}**\'s face~',
            '😸 **{user}** bats at **{target}** playfully with soft paws~',
            '✨ **{user}** arches their back and yawns in **{target}**\'s face lazily~',
            '🌸 **{user}** curls up on **{target}** and refuses to move~',
            '🐱 **{user}** trills cutely and nuzzles **{target}**\'s hand~',
        ],
        solo: [
            '🐾 **{user}** goes full catgirl mode — complete with ears and tail!',
            '😸 **{user}** is being adorably feline today~',
        ],
        sources: [
            { id: 'purrbot', endpoint: 'https://purrbot.site/api/img/nsfw/neko/gif' },
            { id: 'nekobot', type: 'kemonomimi' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
        ],
    },
    femboy: {
        desc: 'Femboy roleplay — soft, pretty, and surprisingly bold!',
        emoji: '🎀',
        color: '#FFB6C1',
        messages: [
            '🎀 **{user}** spins around in their outfit in front of **{target}**: *"Well? How do I look?"*',
            '💕 **{user}** leans against **{target}** with a coy smile~',
            '🌸 **{user}** tugs at **{target}**\'s sleeve shyly: *"Don\'t stare too hard~"*',
            '✨ **{user}** brushes their hair back and winks at **{target}**~',
            '😳 **{user}** blushes but holds **{target}**\'s gaze boldly~',
        ],
        solo: [
            '🎀 **{user}** enters the room dressed adorably — heads turn!',
            '💕 **{user}** is feeling soft and confident today~',
        ],
        sources: [
            { id: 'nekobot', type: 'kemonomimi' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/trap' },
        ],
    },
    dominate: {
        desc: 'Domination roleplay — take control!',
        emoji: '👑',
        color: '#4B0082',
        messages: [
            '👑 **{user}** pins **{target}** down with an iron grip: *"You don\'t move unless I say so."*',
            '🔥 **{user}** grabs **{target}** by the collar and pulls them close~',
            '😈 **{user}** looms over **{target}**: *"You\'re completely at my mercy right now~"*',
            '🖤 **{user}** runs a hand through **{target}**\'s hair and tightens their grip~',
            '⚡ **{user}** commands **{target}** with a single look — and **{target}** obeys~',
        ],
        solo: [
            '👑 **{user}** is in full dominant mode — who dares approach?',
            '😈 **{user}** exudes commanding energy today~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    submit: {
        desc: 'Submission roleplay — surrender completely!',
        emoji: '🙇',
        color: '#9370DB',
        messages: [
            '🙇 **{user}** kneels before **{target}**, head bowed: *"I\'m all yours~"*',
            '💕 **{user}** looks up at **{target}** with soft, trusting eyes~',
            '🌸 **{user}** extends their hands toward **{target}**: *"Do whatever you want with me~"*',
            '✨ **{user}** leans into **{target}**\'s touch without resistance~',
            '🖤 **{user}** whispers to **{target}**: *"I\'ll be good... I promise~"*',
        ],
        solo: [
            '🙇 **{user}** is in a wonderfully submissive mood today~',
            '💕 **{user}** is searching for someone to surrender to~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    tentacle: {
        desc: 'Tentacle roleplay — inescapable and relentless!',
        emoji: '🦑',
        color: '#2E8B57',
        messages: [
            '🦑 **{user}** summons dark tentacles that wrap around **{target}** completely!',
            '🌊 **{user}**\'s tentacles coil around **{target}**, not letting go~',
            '😈 **{user}** grins as tentacles explore every inch of **{target}**~',
            '🖤 **{user}** lets the tentacles do the work on **{target}**~',
            '✨ **{user}** watches as **{target}** is thoroughly overwhelmed~',
        ],
        solo: [
            '🦑 **{user}** is radiating dangerous tentacle energy right now~',
            '🌊 **{user}** summons tentacles and waits patiently~',
        ],
        sources: [
            { id: 'nekobot', type: 'tentacle' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    bdsm: {
        desc: 'BDSM roleplay — bonds, rules, and trust!',
        emoji: '⛓️',
        color: '#1C1C1C',
        messages: [
            '⛓️ **{user}** restrains **{target}** and smiles with quiet authority~',
            '🖤 **{user}** fastens a collar around **{target}**\'s neck carefully~',
            '😈 **{user}** circles **{target}** slowly: *"You\'re completely helpless now~"*',
            '🔥 **{user}** leans down to **{target}**: *"Safe word if you need it~"*',
            '✨ **{user}** takes full control of the situation with **{target}**~',
        ],
        solo: [
            '⛓️ **{user}** displays their collection with pride~',
            '🖤 **{user}** is in a commanding mood — who will volunteer?',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    ahegao: {
        desc: 'Ahegao roleplay — completely overwhelmed!',
        emoji: '😵',
        color: '#FF69B4',
        messages: [
            '😵 **{user}** makes the most intense ahegao face at **{target}**~',
            '💦 **{user}** loses all composure in front of **{target}** completely~',
            '🌸 **{user}** glazes over and melts against **{target}**~',
            '✨ **{user}** rolls their eyes back and shudders against **{target}**~',
            '🔥 **{user}** is overwhelmed to the absolute limit by **{target}**~',
        ],
        solo: [
            '😵 **{user}** makes that face at absolutely nobody... or everyone~',
            '💦 **{user}** is completely lost in sensation right now~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    corruption: {
        desc: 'Corruption roleplay — innocence slowly fading!',
        emoji: '🖤',
        color: '#2F0057',
        messages: [
            '🖤 **{user}** wraps dark, corrupting energy around **{target}**~',
            '😈 **{user}** whispers forbidden things into **{target}**\'s ear~',
            '🌙 **{user}** watches as something shifts in **{target}**\'s eyes~',
            '✨ **{user}** smiles as **{target}**\'s resistance crumbles away~',
            '🔥 **{user}** guides **{target}** past a point of no return~',
        ],
        solo: [
            '🖤 **{user}** is spreading corruption like a disease~',
            '😈 **{user}** has that look — something wicked is awakening~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
    tease: {
        desc: 'Hentai tease — slow, deliberate, agonizing!',
        emoji: '😏',
        color: '#FF1493',
        messages: [
            '😏 **{user}** traces a finger down **{target}**\'s side very slowly~',
            '🌶️ **{user}** gets dangerously close to **{target}** then pulls back~',
            '🔥 **{user}** breathes on **{target}**\'s neck without touching~',
            '✨ **{user}** toys with **{target}** expertly, giving just enough~',
            '😈 **{user}** makes **{target}** beg without lifting a finger~',
        ],
        solo: [
            '😏 **{user}** is in maximum tease mode — everyone suffers~',
            '🌶️ **{user}** is radiating unbearable tease energy right now~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
        ],
    },
    cuddle: {
        desc: 'Lewd cuddle — intimate and close!',
        emoji: '💞',
        color: '#FF69B4',
        messages: [
            '💞 **{user}** pulls **{target}** close with both arms, flush against them~',
            '🌙 **{user}** and **{target}** tangle together in the most intimate way~',
            '🔥 **{user}** holds **{target}** from behind, lips near their ear~',
            '✨ **{user}** wraps every limb around **{target}** possessively~',
            '🖤 **{user}** and **{target}** melt into each other completely~',
        ],
        solo: [
            '💞 **{user}** curls up alone, craving someone to hold~',
            '🌙 **{user}** is feeling intimately cuddly tonight~',
        ],
        sources: [
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
            { id: 'nekobot', type: 'hentai' },
        ],
    },
    kiss: {
        desc: 'Hentai kiss — passionate and hunger-filled!',
        emoji: '💋',
        color: '#8B0000',
        messages: [
            '💋 **{user}** crashes their lips into **{target}**\'s hungrily~',
            '🔥 **{user}** grabs **{target}** by the face and kisses them breathless~',
            '🌹 **{user}** parts from **{target}** with a long thread of saliva~',
            '😈 **{user}** bites **{target}**\'s lip mid-kiss and smirks~',
            '✨ **{user}** devours **{target}**\'s mouth completely~',
        ],
        solo: [
            '💋 **{user}** licks their lips and looks around hungrily~',
            '🔥 **{user}** is craving a very passionate kiss right now~',
        ],
        sources: [
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/neko' },
            { id: 'nekobot', type: 'hentai' },
        ],
    },
    onsen: {
        desc: 'Hot spring (onsen) roleplay — steamy and relaxing!',
        emoji: '♨️',
        color: '#FF6347',
        messages: [
            '♨️ **{user}** slides into the hot spring next to **{target}**~',
            '💦 **{user}** splashes warm water toward **{target}** playfully~',
            '🌸 **{user}** floats in the steamy water and gazes at **{target}**~',
            '😊 **{user}** leans against the edge right beside **{target}**~',
            '🔥 **{user}** sinks into the hot water with **{target}**, skin close~',
        ],
        solo: [
            '♨️ **{user}** relaxes in the onsen, steam rising all around~',
            '💦 **{user}** enjoys a private hot spring session~',
        ],
        sources: [
            { id: 'nekobot', type: 'hentai' },
            { id: 'waifupics', endpoint: 'https://api.waifu.pics/nsfw/waifu' },
        ],
    },
};

// ── Helper: fetch image with fallback chain ───────────────────────────────────
async function fetchHrpImage(sources, actionName) {
    for (const src of sources) {
        let data = null;
        try {
            if (src.id === 'purrbot')   data = await fetchPurrbot(src.endpoint);
            else if (src.id === 'waifupics') data = await fetchWaifu(src.endpoint);
            else if (src.id === 'nekobot')   data = await fetchNekoBot(src.type);
            else if (src.id === 'waifuim')   data = await fetchWaifuIm(src.tag, src.nsfw !== false);
            else if (src.id === 'nekosbest') data = await fetchNekoBest(src.action);
        } catch (_) {}
        if (data && !data.error && data.url) {
            logInfo(`[/hrp ${actionName}] Source OK: ${src.id}`);
            return data;
        }
    }
    return null;
}

function pickMsg(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildMsg(template, user, target) {
    return template.replace(/{user}/g, user).replace(/{target}/g, target || 'everyone');
}

// ── Build SlashCommand with all subcommands ───────────────────────────────────
const builder = new SlashCommandBuilder()
    .setName('hrp')
    .setDescription('Hentai roleplay — anime scenarios, dark fantasies, and more!')
    .setNSFW(true)
    .setIntegrationTypes(0)
    .setContexts(0);

for (const [name, cfg] of Object.entries(HRP_DATA)) {
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
        const cfg = HRP_DATA[action];

        if (!cfg) {
            return isButton
                ? null
                : interaction.reply({ content: '❌ Unknown HRP action.', ephemeral: true });
        }

        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const target = !isButton ? interaction.options.getUser('target') : null;
        const userName   = `**${interaction.user.username}**`;
        const targetName = target ? `**${target.username}**` : null;

        const template   = targetName ? pickMsg(cfg.messages) : pickMsg(cfg.solo);
        const description = buildMsg(template, userName, targetName);

        const imageData = await fetchHrpImage(cfg.sources, action);

        const embed = new EmbedBuilder()
            .setTitle(`${cfg.emoji} ▸ Hentai RP — ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .setDescription(description)
            .setColor(cfg.color)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        if (imageData && imageData.url) {
            embed.setImage(imageData.url);
        } else {
            embed.setDescription(description + '\n\n*⚠️ Image unavailable right now — action still counts!*');
        }

        const refreshId = `refresh_hrp_${action}`;

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
