const { MessageFlags } = require('discord.js');
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const {
  setSticky,
  removeSticky,
  updateLastMessageId
} = require('../utils/stickyManager');

const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sticky')
    .setDescription('Manage the sticky message for this channel')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Set a sticky embed')
        .addStringOption(opt =>
          opt
            .setName('message')
            .setDescription('Message to stick')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove the sticky message')
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const content = interaction.options.getString('message');

      setSticky(interaction.channel.id, content);

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(content)
        .setFooter({ text: '📌 Sticky Message' })
        .setTimestamp();

      const msg = await interaction.channel.send({
        embeds: [embed]
      });

      updateLastMessageId(interaction.channel.id, msg.id);

      return interaction.reply({
        content: 'Sticky message created.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'remove') {
      const sticky = removeSticky(interaction.channel.id);

      if (!sticky) {
        return interaction.reply({
          content: 'This channel has no sticky message.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (sticky.lastMessageId) {
        const old = await interaction.channel.messages
          .fetch(sticky.lastMessageId)
          .catch(() => null);

        if (old) await old.delete().catch(() => {});
      }

      return interaction.reply({
        content: 'Sticky message removed.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
