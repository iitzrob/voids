const { MessageFlags } = require('discord.js');
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('service-tickets')
    .setDescription('Post the service ticket panel (building/digging/regears)'),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
    }

    const categories = config.serviceCategories || [];
    if (!categories.length) {
      return interaction.reply({ content: 'No serviceCategories are configured in config.json.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setTitle(config.servicePanel?.title || 'Services')
      .setDescription(config.servicePanel?.description || 'Select a service below to open a ticket.')
      .setColor(config.servicePanel?.color || '#2b2d31');

    const rows = [];
    let row = new ActionRowBuilder();
    categories.forEach((cat, i) => {
      if (i > 0 && i % 5 === 0) {
        rows.push(row);
        row = new ActionRowBuilder();
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`service_ticket_open_${cat.id}`)
          .setLabel(cat.label)
          .setEmoji(cat.emoji || undefined)
          .setStyle(ButtonStyle.Primary)
      );
    });
    rows.push(row);

    await interaction.channel.send({ embeds: [embed], components: rows });
    await interaction.reply({ content: 'Service ticket panel posted.', flags: MessageFlags.Ephemeral });
  },
};
