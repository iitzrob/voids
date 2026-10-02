require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
  Options,
} = require('discord.js');


/* =========================================================
   CLIENT
========================================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],

  // Keep memory low: small message cache, and don't cache things this bot
  // never reads (voice states, presences, reactions, invites, bans, stages).
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 50,
    VoiceStateManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    GuildInviteManager: 0,
    GuildBanManager: 0,
    StageInstanceManager: 0,
    ThreadMemberManager: 0,
  }),

  // Drop cached messages older than 30 minutes, checked every 5 minutes.
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 300,
      lifetime: 1800,
    },
  },

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});


/* =========================================================
   SLASH COMMANDS
========================================================= */

client.commands = new Collection();

const commandsPath = path.join(
  __dirname,
  'commands'
);

if (fs.existsSync(commandsPath)) {

  for (
    const file of fs
      .readdirSync(commandsPath)
      .filter((f) => f.endsWith('.js'))
  ) {

    try {

      const command = require(
        path.join(
          commandsPath,
          file
        )
      );

      if (
        command?.data?.name &&
        typeof command.execute === 'function'
      ) {

        client.commands.set(
          command.data.name,
          command
        );

        console.log(
          `[COMMAND] Loaded /${command.data.name}`
        );

      } else {

        console.warn(
          `[COMMAND] Skipping invalid command file: ${file}`
        );
      }

    } catch (err) {

      console.error(
        `[COMMAND] Failed to load ${file}:`,
        err
      );
    }
  }
}


/* =========================================================
   EVENTS
========================================================= */

const eventsPath = path.join(
  __dirname,
  'events'
);

if (fs.existsSync(eventsPath)) {

  for (
    const file of fs
      .readdirSync(eventsPath)
      .filter((f) => f.endsWith('.js'))
  ) {

    try {

      const event = require(
        path.join(
          eventsPath,
          file
        )
      );


      /* =====================================================
         CUSTOM MODULE

         Modules with register(client) are NOT normal
         Discord events.
      ===================================================== */

      if (
        typeof event.register === 'function'
      ) {

        event.register(client);

        console.log(
          `[EVENT] Registered custom module: ${file}`
        );

        continue;
      }


      /* =====================================================
         NORMAL DISCORD EVENT
      ===================================================== */

      if (
        event.once &&
        event.name &&
        typeof event.execute === 'function'
      ) {

        client.once(
          event.name,
          (...args) =>
            event.execute(
              ...args,
              client
            )
        );

        console.log(
          `[EVENT] Loaded once event ${event.name} (${file})`
        );

        continue;
      }


      if (
        event.name &&
        typeof event.execute === 'function'
      ) {

        client.on(
          event.name,
          (...args) =>
            event.execute(
              ...args,
              client
            )
        );

        console.log(
          `[EVENT] Loaded ${event.name} (${file})`
        );

        continue;
      }


      console.warn(
        `[EVENT] Skipping invalid event file: ${file}`
      );

    } catch (err) {

      console.error(
        `[EVENT] Failed to load ${file}:`,
        err
      );
    }
  }
}


/* =========================================================
   WEBSITE APPLICATION API — not used, disabled.
   (utils/webApplicationManager.js is kept in case you turn
   the website back on later — just re-add the require and
   the startWebApplicationServer(client, config) call above.)
========================================================= */


/* =========================================================
   TOKEN CHECK
========================================================= */

if (
  !process.env.DISCORD_TOKEN
) {

  console.error(
    '❌ Missing DISCORD_TOKEN in .env — copy .env.example to .env and fill it in.'
  );

  process.exit(1);
}


/* =========================================================
   LOGIN
========================================================= */

client.login(
  process.env.DISCORD_TOKEN
);
