const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
} = require('discord.js');
const { parseTopic, findCategory, isServiceTicket } = require('../utils/ticketManager');
const config = require('../config.json');

const valid = (ids) =>
  (ids || []).filter((id) => id && typeof id === 'string' && !id.startsWith('PUT_'));

// Same role lookup the ticket manager uses for claim/close
function getStaffRoleIds(meta) {
  if (meta.isCustom && meta.customRoleId) return [meta.customRoleId];

  if (meta.categoryId.startsWith('application_')) {
    return valid(config.applicationTicketRoleIds);
  }

  const category = findCategory(meta.categoryId);
  const categoryRoles = valid(category?.roleIds);
  if (categoryRoles.length) return categoryRoles;

  if (isServiceTicket(meta.categoryId)) {
    const serviceRoles = valid(config.serviceTicketRoleIds);
    return serviceRoles.length ? serviceRoles : valid(config.ticketRoleIds);
  }

  return valid(config.ticketRoleIds);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket tools')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a user to this ticket')
        .addUserOption((opt) =>
          opt.setName('user').setDescription('User to add to the ticket').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'add') return;

    const meta = parseTopic(interaction.channel.topic);
    if (!meta) {
      return interaction.reply({
        content: 'This does not look like a ticket channel.',
        ephemeral: true,
      });
    }

    // Staff check: ticket staff role, Manage Channels, or the staff member who claimed it
    const member = interaction.member;
    const staffRoleIds = getStaffRoleIds(meta);
    const isTicketStaff = staffRoleIds.some((id) => member.roles.cache.has(id));
    const isClaimer =
      interaction.channel.permissionOverwrites.cache.get(member.id)?.allow.has(
        PermissionsBitField.Flags.ManageMessages
      ) || false;

    if (
      !isTicketStaff &&
      !isClaimer &&
      !member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    ) {
      return interaction.reply({
        content: 'Only ticket staff can add users to this ticket.',
        ephemeral: true,
      });
    }

    const target = interaction.options.getUser('user');

    if (target.bot) {
      return interaction.reply({ content: "You can't add a bot to a ticket.", ephemeral: true });
    }

    if (target.id === meta.userId) {
      return interaction.reply({
        content: 'That user opened this ticket already.',
        ephemeral: true,
      });
    }

    const existing = interaction.channel.permissionOverwrites.cache.get(target.id);
    if (existing?.allow.has(PermissionsBitField.Flags.ViewChannel)) {
      return interaction.reply({
        content: `${target} is already in this ticket.`,
        ephemeral: true,
      });
    }

    try {
      // Normal user perms only — no ManageMessages / ManageChannels
      await interaction.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
      });
    } catch (err) {
      console.error('Failed to add user to ticket:', err);
      return interaction.reply({
        content: ' Could not add that user to the ticket. Check my permissions on this channel.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setDescription(` ${target} was added to this ticket by ${interaction.user}.`)
      .setColor('#57F287');

    await interaction.reply({ content: `${target}`, embeds: [embed] });
  },
};
