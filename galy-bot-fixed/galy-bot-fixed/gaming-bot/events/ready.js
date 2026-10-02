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
    // after 2 minutes, then every 10 minutes. Search the logs for "[MEM]".
    // "afterGC" is the heap after a forced garbage collection (needs the
    // --expose-gc node flag): if it stays flat the bot is only slow to clean
    // up, if it keeps climbing something is really holding on to memory.
    const memReport = () => {
      const mb = (n) => Math.round(n / 1048576);
      const before = process.memoryUsage();
      let afterGC = 'n/a';
      if (typeof global.gc === 'function') {
        global.gc();
        afterGC = mb(process.memoryUsage().heapUsed) + 'MB';
      }
      const members = client.guilds.cache.reduce((n, g) => n + g.members.cache.size, 0);

      // Extra numbers to find what is growing: cached messages, timers waiting,
      // and requests to Discord still queued up (rest=handlers/queued).
      let messages = 0;
      client.channels.cache.forEach((c) => { if (c.messages) messages += c.messages.cache.size; });
      let timers = 'n/a';
      try {
        if (typeof process.getActiveResourcesInfo === 'function') {
          timers = process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length;
        }
      } catch {}
      let queued = 0;
      let handlers = 0;
      try {
        handlers = client.rest.handlers.size;
        client.rest.handlers.forEach((h) => { queued += Number(h.queueRemaining) || 0; });
      } catch {}

      console.log(
        `[MEM] rss=${mb(before.rss)}MB heapUsed=${mb(before.heapUsed)}MB afterGC=${afterGC} ` +
        `external=${mb(before.external)}MB | guilds=${client.guilds.cache.size} ` +
        `members=${members} users=${client.users.cache.size} messages=${messages} ` +
        `timers=${timers} rest=${handlers}/${queued}`
      );
    };
    setTimeout(memReport, 2 * 60 * 1000);
    setInterval(memReport, 10 * 60 * 1000);

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
