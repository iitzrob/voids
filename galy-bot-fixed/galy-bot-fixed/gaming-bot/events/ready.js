const { rearmActiveGiveaways } = require('../utils/giveawayManager');
const { startDailyGiveawayLoop } = require('../utils/dailyGiveaway');
const { rearmTempBans } = require('../utils/tempBanManager');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    if (typeof rearmActiveGiveaways === 'function') {
      rearmActiveGiveaways(client);
    } else {
      console.error(
        '[READY] rearmActiveGiveaways is not a function — check utils/giveawayManager.js exports. Skipping giveaway rearm so the bot can still start.'
      );
    }

    // Re-schedule any temp-ban auto-unbans that were still pending when the
    // bot last shut down (in-memory timers don't survive a restart).
    rearmTempBans(client);

    startDailyGiveawayLoop(client);

    // Memory report (temporary, for finding out where RAM goes). Logs once
    // after 2 minutes, then every 30 minutes. Search the logs for "[MEM]".
    const memReport = () => {
      const m = process.memoryUsage();
      const mb = (n) => Math.round(n / 1048576);
      const members = client.guilds.cache.reduce((n, g) => n + g.members.cache.size, 0);
      const channels = client.guilds.cache.reduce((n, g) => n + g.channels.cache.size, 0);
      let messages = 0;
      for (const g of client.guilds.cache.values()) {
        for (const c of g.channels.cache.values()) messages += c.messages?.cache?.size || 0;
      }
      console.log(
        `[MEM] rss=${mb(m.rss)}MB heapUsed=${mb(m.heapUsed)}MB heapTotal=${mb(m.heapTotal)}MB ` +
        `external=${mb(m.external)}MB | guilds=${client.guilds.cache.size} channels=${channels} ` +
        `members=${members} users=${client.users.cache.size} messages=${messages}`
      );
    };
    setTimeout(memReport, 2 * 60 * 1000);
    setInterval(memReport, 30 * 60 * 1000);

    const statuses = [
      { name: 'looking for staff so apply', type: 2 },
      { dynamic: 'memberCount', type: 3 },
    ];

    function buildStatusName(status) {
      if (status.dynamic === 'memberCount') {
        const memberCount = client.guilds.cache.reduce((sum, g) => sum + (g.memberCount || 0), 0);
        return `${memberCount.toLocaleString()} members`;
      }
      return status.name;
    }

    let index = 0;
    client.user.setActivity(buildStatusName(statuses[index]), { type: statuses[index].type });

    setInterval(() => {
      index = (index + 1) % statuses.length;
      client.user.setActivity(buildStatusName(statuses[index]), { type: statuses[index].type });
    }, 10 * 1000);
  },
};
