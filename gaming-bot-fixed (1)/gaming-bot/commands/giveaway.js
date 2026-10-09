const { SlashCommandBuilder } = require('discord.js');
const { isMod } = require('../utils/permissions');
const { fail, done, say, NO_PERMS } = require('../utils/reply');
const {
  loadGiveaways,
  saveGiveaways,
  parseDuration,
  pickWinners,
  buildGiveawayEmbed,
  buildJoinRow,
  scheduleGiveaway,
  endGiveaway,
} = require('../utils/giveawayManager');

const DAY = 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Run giveaways')
    .addSubcommand((s) =>
      s
        .setName('start')
        .setDescription('Start a giveaway')
        .addStringOption((o) => o.setName('prize').setDescription('What you\'re giving away').setRequired(true))
        .addStringOption((o) => o.setName('time').setDescription('Length, e.g. 30m, 1h, 2d').setRequired(true))
        .addIntegerOption((o) => o.setName('winners').setDescription('How many winners').setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) =>
      s
        .setName('end')
        .setDescription('End a giveaway now')
        .addStringOption((o) => o.setName('id').setDescription('Giveaway message ID').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('reroll')
        .setDescription('Pick new winners')
        .addStringOption((o) => o.setName('id').setDescription('Giveaway message ID').setRequired(true))
    ),

  async execute(interaction) {
    if (!isMod(interaction.member)) return fail(interaction, NO_PERMS);

    const sub = interaction.options.getSubcommand();

    /* ---------- start ---------- */
    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const winnerCount = interaction.options.getInteger('winners');
      const ms = parseDuration(interaction.options.getString('time'));

      if (!ms) return fail(interaction, 'Use a time like `30m`, `1h` or `2d`.');
      if (ms < 10 * 1000) return fail(interaction, 'Giveaways must run for at least 10 seconds.');
      if (ms > 30 * DAY) return fail(interaction, 'Giveaways can run for 30 days at most.');

      const giveaway = {
        prize,
        winnerCount,
        endTimestamp: Date.now() + ms,
        channelId: interaction.channel.id,
        hostId: interaction.user.id,
        entrants: [],
        ended: false,
      };

      await interaction.reply({ embeds: [buildGiveawayEmbed(giveaway)], components: [buildJoinRow(0)] });
      const message = await interaction.fetchReply();

      const giveaways = loadGiveaways();
      giveaways[message.id] = giveaway;
      saveGiveaways(giveaways);
      scheduleGiveaway(interaction.client, message.id, ms);

      // DM the host the ID so they can reroll later.
      interaction.user
        .send(`Your **${prize}** giveaway is live.\nID: \`${message.id}\`\nReroll with \`/giveaway reroll id:${message.id}\``)
        .catch(() => {});
      return;
    }

    /* ---------- end ---------- */
    if (sub === 'end') {
      const id = interaction.options.getString('id');
      const giveaway = loadGiveaways()[id];

      if (!giveaway) return fail(interaction, 'Giveaway not found.');
      if (giveaway.ended) return fail(interaction, 'That giveaway already ended.');

      await done(interaction, 'Ending giveaway.');
      return endGiveaway(interaction.client, id);
    }

    /* ---------- reroll ---------- */
    if (sub === 'reroll') {
      const id = interaction.options.getString('id');
      const giveaways = loadGiveaways();
      const giveaway = giveaways[id];

      if (!giveaway || !giveaway.ended) return fail(interaction, 'Giveaway not found or still running.');

      const winners = pickWinners(giveaway.entrants || [], giveaway.winnerCount);
      if (!winners.length) return fail(interaction, 'Nobody entered, so there\'s no one to pick.');

      giveaway.winners = winners;
      giveaways[id] = giveaway;
      saveGiveaways(giveaways);

      try {
        const channel = await interaction.client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(id).catch(() => null);
        if (message) {
          await message.edit({
            embeds: [buildGiveawayEmbed(giveaway)],
            components: [buildJoinRow((giveaway.entrants || []).length, true)],
          });
        }
      } catch (err) {
        console.error('[giveaway] reroll edit failed:', err);
      }

      return say(interaction, `🎉 New winner${winners.length > 1 ? 's' : ''} for **${giveaway.prize}**: ${winners.map((w) => `<@${w}>`).join(', ')}`);
    }
  },
};
