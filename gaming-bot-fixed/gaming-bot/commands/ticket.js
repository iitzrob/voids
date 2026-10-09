const { MessageFlags } = require('discord.js');
const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
} = require('discord.js');
const { parseTopic, getStaffRoleIds } = require('../utils/ticketManager');
const { COLOR } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket tools')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a user to this ticket (they get no staff perms)')
        .addUserOption((opt) =>
          opt.setName('user').setDescription('User to add to the ticket').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'add') return;

    const meta = parseTopic(interaction.channel.topic);
    if (!meta) {
      return interaction.reply({
        content: 'this is not a ticket channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Staff check: ticket staff role, Manage Channels, or the staff member who claimed it
    const member = interaction.member;
    const isTicketStaff = getStaffRoleIds(meta).some((id) => member.roles.cache.has(id));
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
        content: 'only ticket staff can add people to this ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = interaction.options.getUser('user');

    if (target.bot) {
      return interaction.reply({ content: "you can't add a bot to a ticket.", flags: MessageFlags.Ephemeral });
    }

    if (target.id === meta.userId) {
      return interaction.reply({
        content: 'that user opened this ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const existing = interaction.channel.permissionOverwrites.cache.get(target.id);
    if (existing?.allow.has(PermissionsBitField.Flags.ViewChannel)) {
      return interaction.reply({
        content: `${target} is already in this ticket.`,
        flags: MessageFlags.Ephemeral,
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
        content: "couldn't add that user. check my permissions on this channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setDescription(`${target} was added by ${interaction.user}.`)
      .setColor(COLOR);

    await interaction.reply({ content: `${target}`, embeds: [embed] });
  },
};
