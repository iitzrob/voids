const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isMod } = require('../utils/permissions');
const { fail, done, NO_PERMS } = require('../utils/reply');

const ROLES = {
  giveaway: '1526927249604083904', // Giveaway Ping
  drop: '1526927287486779566', // Quick Drop Ping
};

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const DATA_DIR = process.env.DATA_DIR || '/app/data';
const FILE = path.join(DATA_DIR, 'gw-cooldowns.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data));
  } catch (err) {
    console.error('[gw] could not save cooldowns:', err);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gw')
    .setDescription('Ping the giveaway or drop role')
    .addStringOption((o) =>
      o
        .setName('ping')
        .setDescription('Which role to ping')
        .setRequired(true)
        .addChoices(
          { name: 'Giveaway', value: 'giveaway' },
          { name: 'Quick drop', value: 'drop' }
        )
    ),

  async execute(interaction) {
    const member = interaction.member;
    const noCooldown = member.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!isMod(member) && !noCooldown) return fail(interaction, NO_PERMS);

    // 1 hour cooldown. Manage Server / Admin skip it.
    const cooldowns = load();
    if (!noCooldown) {
      const next = (cooldowns[member.id] || 0) + COOLDOWN_MS;
      if (Date.now() < next) {
        return fail(interaction, `Try again <t:${Math.floor(next / 1000)}:R>.`);
      }
    }

    const roleId = ROLES[interaction.options.getString('ping')];

    await interaction.channel.send({
      content: `<@&${roleId}>`,
      allowedMentions: { roles: [roleId] },
    });

    if (!noCooldown) {
      cooldowns[member.id] = Date.now();
      save(cooldowns);
    }

    return done(interaction, 'Pinged.');
  },
};
