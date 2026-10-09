# voidscove bot

tickets, applications, giveaways, vouches and moderation for the voidscove discord.

## setup

```bash
npm install
cp .env.example .env     # fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID
node deploy-commands.js  # register slash commands
node index.js
```

needs node 22.12 or newer. enable the **server members** and **message content** intents on the bot page.

## running with pm2

```bash
pm2 start index.js --name gaming-bot
pm2 save
```

update:

```bash
git pull && node deploy-commands.js && pm2 restart gaming-bot
```

## tickets

- every user can have **2 open tickets at once**, counted across all ticket types (`maxOpenTicketsPerUser` in `config.json`)
- `/ticket add user:@someone` adds a person to the ticket without staff perms
- `/ticket-rename`, `/close`, and the claim / close buttons work for the staff roles set on that ticket category
- `/panel`, `/service-tickets`, `/apply-panel` post the panels

## config

everything is in `config.json`: role ids, channel ids, ticket categories and questions, panel text.
`modUserIds` is a list of user ids that always count as mods.

## data

json files (giveaways, warnings, staff stats, temp bans, sticky messages, applications) are written to `DATA_DIR`.
if it isn't set the bot uses `/app/data`, so keep that folder when you move or redeploy.
