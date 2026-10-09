const { MessageFlags } = require('discord.js');
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { parseTopic, getStaffRoleIds } = require('../utils/ticketManager');
const { incrementStat } = require('../utils/staffTracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-rename')
    .setDescription('Rename the current ticket channel')
    .addStringOption((opt) =>
      opt.setName('name').setDescription('New channel name').setRequired(true)
    ),

  async execute(interaction) {
    const meta = parseTopic(interaction.channel.topic);
    if (!meta) {
      return interaction.reply({
        content: 'this is not a ticket channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const member = interaction.member;
    const isTicketStaff = getStaffRoleIds(meta).some((id) => member.roles.cache.has(id));

    if (!isTicketStaff && !member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({
        content: "you can't rename this ticket.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const newName = interaction.options
      .getString('name')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 90);

    if (!newName) {
      return interaction.reply({ content: 'that name is not valid.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await interaction.channel.setName(newName);
    } catch (err) {
      console.error('Failed to rename ticket channel:', err);
      return interaction.editReply({
        content: "couldn't rename the channel, discord may be rate limiting renames. try again shortly.",
      });
    }

    await interaction.editReply({ content: `renamed to **${newName}**.` });

    incrementStat(interaction.guild, interaction.user.id, 'ticketsRenamed').catch((err) => {
      console.error('Failed to update staff tracker for ticket rename:', err);
    });
  },
};
