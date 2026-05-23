const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { logInfo } = require('../utils/logger');

function levenshteinDistance(s, t) {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) { arr[i] = [i]; }
    for (let j = 0; j <= s.length; j++) { arr[0][j] = j; }
    for (let i = 1; i <= t.length; i++) {
        for (let j = 1; j <= s.length; j++) {
            const cost = t[i - 1] === s[j - 1] ? 0 : 1;
            arr[i][j] = Math.min(arr[i - 1][j] + 1, arr[i][j - 1] + 1, arr[i - 1][j - 1] + cost);
        }
    }
    return arr[t.length][s.length];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Directory of all available commands and detailed information.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Select a specific command for detailed information.')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = Array.from(interaction.client.commands.keys());

        const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },

    async execute(interaction, isButton = false, isModal = false) {
        if (isButton && interaction.customId.startsWith('help_search_modal_btn')) {
            const parts = interaction.customId.split('_');
            const sourcePage = parts[4] || 1; // help_search_modal_btn_X

            const modal = new ModalBuilder()
                .setCustomId(`help_search_modal_${sourcePage}`)
                .setTitle('Search for a Command');

            const searchInput = new TextInputBuilder()
                .setCustomId('search_query')
                .setLabel('Enter command name...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(searchInput));
            await interaction.showModal(modal);
            return;
        }

        if (!isButton && !isModal) {
            await interaction.deferReply();
        } else if (isButton || isModal) {
            await interaction.deferUpdate();
        }

        const client = interaction.client;
        const commands = Array.from(client.commands.values());

        let targetCommandName = null;
        let page = 1;

        if (isButton) {
            const parts = interaction.customId.split('_');
            if (parts[1] === 'page') {
                page = parseInt(parts[2], 10);
                logInfo(`[HELP] User navigated back to Page ${page}`);
            } else if (parts[1] === 'command') {
                targetCommandName = parts.slice(2).join('_');
            }
        } else if (isModal) {
            const parts = interaction.customId.split('_');
            page = parseInt(parts[3], 10) || 1; // help_search_modal_X

            const query = interaction.fields.getTextInputValue('search_query').toLowerCase();
            let bestMatch = null;
            let lowestDistance = Infinity;

            for (const cmd of commands) {
                const name = cmd.data.name;
                const distance = levenshteinDistance(query, name);
                if (distance < lowestDistance) {
                    lowestDistance = distance;
                    bestMatch = name;
                }
            }

            // Allow some fuzziness, threshold of 3 edits max
            if (bestMatch && lowestDistance <= 3) {
                targetCommandName = bestMatch;
            } else {
                targetCommandName = query; // will fail below and show error
            }
        } else {
            targetCommandName = interaction.options.getString('command');
        }

        // Mode B: Specific Command Detail
        if (targetCommandName) {
            const command = client.commands.get(targetCommandName);

            if (!command) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ ▸ Error')
                    .setDescription(`Could not find information for command \`${targetCommandName}\`.`)
                    .setColor('Red');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`help_page_${page}`)
                            .setLabel('🔙 ▸ Back to Directory')
                            .setStyle(ButtonStyle.Secondary)
                    );

                return await interaction.editReply({ embeds: [errorEmbed], components: [row] });
            }

            const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const embed = new EmbedBuilder()
                .setTitle(`🔞 ▸ Command Details: /${command.data.name}`)
                .setDescription(`**Description:**\n${command.data.description}`)
                .setColor(`#${randomColor}`)
                .setFooter({
                    text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            let paramsText = '';
            if (command.data.options && command.data.options.length > 0) {
                for (const option of command.data.options) {
                    paramsText += `• **\`${option.name}\`** ${option.required ? '(Required)' : '(Optional)'}\n  *${option.description}*\n`;
                }
            } else {
                paramsText = '*No parameters available for this command.*';
            }

            embed.addFields({ name: 'Parameters', value: paramsText });

            const cmdIndex = commands.findIndex(c => c.data.name === command.data.name);
            const ITEMS_PER_PAGE = 8;
            const returnPage = Math.floor(cmdIndex / ITEMS_PER_PAGE) + 1;

            logInfo(`[HELP] User navigated to Command: ${command.data.name}`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`help_page_${returnPage}`) // Dynamic Return Page
                        .setLabel('🔙 ▸ Back to Directory')
                        .setStyle(ButtonStyle.Secondary)
                );

            return await interaction.editReply({ embeds: [embed], components: [row] });
        }

        // Mode A: General Directory
        const ITEMS_PER_PAGE = 8;
        const totalPages = Math.ceil(commands.length / ITEMS_PER_PAGE) || 1;

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const currentCommands = commands.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const embed = new EmbedBuilder()
            .setTitle('🔞 ▸ Command Directory')
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `Page ${page} of ${totalPages} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        let description = 'Here is a list of all available commands:\n\n';
        for (const cmd of currentCommands) {
            description += `**\`/${cmd.data.name}\`**\n*${cmd.data.description}*\n\n`;
        }
        embed.setDescription(description);

        const row = new ActionRowBuilder();

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`help_page_${page - 1}`)
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`help_search_modal_btn_${page}`)
                .setLabel('🔍 ▸ Search')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`help_page_${page + 1}`)
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
