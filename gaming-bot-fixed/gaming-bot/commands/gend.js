const { MessageFlags } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { isMod } = require('../utils/permissions');
const { loadGiveaways, endGiveaway } = require('../utils/giveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('End a giveaway early and pick winners now')
    .addStringOption((opt) =>
      opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true)
    ),

  async execute(interaction) {
    if (!isMod(interaction.member)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
    }

    const messageId = interaction.options.getString('message_id');
    const giveaways = loadGiveaways();
    const giveaway = giveaways[messageId];

    if (!giveaway) {
      return interaction.reply({ content: 'Giveaway not found.', flags: MessageFlags.Ephemeral });
    }
    if (giveaway.ended) {
      return interaction.reply({ content: 'That giveaway has already ended.', flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ content: 'Ending giveaway now…', flags: MessageFlags.Ephemeral });
    await endGiveaway(interaction.client, messageId);
  },
};
