const moment = require('moment');

// TODO: make appeal channel

module.exports = (client, channel) => {
  if (channel.type !== 'text' || (channel.guild ? channel.guild.id !== client.config.modMailGuild : true)) {
    return;
  }

  setTimeout(async () => {
    if (channel.topic !== null) {
      const user = await client.users.fetch(channel.topic.trim());
      const { infractions } = client.userDB.ensure(user.id, '', 'infractions');
      let msg = `__**${user.tag}'s Bee Stings**__`;
      let expPoints = 0;
      let expMsg = '';
      let curPoints = 0;
      let curMsg = '';
      const time = Date.now();
      infractions.forEach((i) => {
        const moderator = client.users.cache.get(i.moderator);
        const mod = moderator ? `Mod: ${moderator.tag}` : `Unknown Mod ID: ${i.moderator || 'No ID Stored'}`;
        const txt = `\n• Case ${i.case} - ${mod} - (${moment.utc(i.date).format('DD MMM YYYY HH:mm')} UTC) ${i.points} bee sting${i.points === 1 ? '' : 's'}\n> Reason: ${i.reason}`
        if ((i.points * 604800000) + i.date > time) {
          curPoints += i.points;
          curMsg += txt;
        } else {
          expPoints += i.points;
          expMsg += txt;
        }
      });

      if (curMsg) {
        msg += `\n**Current bee stings (${curPoints} total):**${curMsg}`;
      }
      if (expMsg) {
        msg += `\n**Expired bee stings (${expPoints} total):**${expMsg}`;
      }


      if (curMsg || expMsg) {
        channel.send(msg, { split: true });
      } else {
        // No infractions
        channel.send(`${user.tag} doesn't have any bee stings!`);
      }
    }
  }, 2000);
};
