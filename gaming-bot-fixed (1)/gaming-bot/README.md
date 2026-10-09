# voidscove bot

tickets, applications, giveaways, vouches and moderation for the voidscove discord.

## setup

```bash
npm install
cp .env.example .env     # fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID
node deploy-commands.js  # register slash commands
node index.js
```

needs node 20 or newer. enable the **server members** and **message content** intents on the bot page.

## running with pm2

```bash
pm2 start index.js --name gaming-bot
pm2 save
```

update:

```bash
git pull && npm install && node deploy-commands.js && pm2 restart gaming-bot
```

## commands

| command | what it does |
| --- | --- |
| `/panel` `/services` `/apply` `/roles` `/custom` | post the ticket, services, application, roles and custom panels |
| `/ticket add` `/ticket rename` `/close` | manage the ticket you're in |
| `/giveaway start` `/giveaway end` `/giveaway reroll` | run giveaways |
| `/ban` `/kick` `/timeout` `/mute` `/warn` `/lockdown` | moderation |
| `/embed` `/sticky` `/honeypot` `/calc` | extras |

every user can have **2 open tickets at once** (`maxOpenTicketsPerUser` in `config.json`).

## config

everything is in `config.json`: role ids, channel ids, ticket categories and questions, panel text.
`modUserIds` is a list of user ids that always count as mods.

## data

json files (giveaways, warnings, staff stats, temp bans, sticky messages, applications) are written to `DATA_DIR`.
if it isn't set the bot uses `/app/data`, so keep that folder when you move or redeploy.
