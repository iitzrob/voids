const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLOR } = require('./theme');

// Small helpers so every command answers in the same clean style.
const card = (text, color = COLOR) => new EmbedBuilder().setColor(color).setDescription(text);

// Private (only the user sees it)
const fail = (interaction, text) =>
  interaction.reply({ embeds: [card(`❌ ${text}`, 0xed4245)], flags: MessageFlags.Ephemeral });

const done = (interaction, text) =>
  interaction.reply({ embeds: [card(`✅ ${text}`)], flags: MessageFlags.Ephemeral });

// Public
const say = (interaction, text) => interaction.reply({ embeds: [card(text)] });

const NO_PERMS = 'You can\'t use this command.';

module.exports = { card, fail, done, say, NO_PERMS };
