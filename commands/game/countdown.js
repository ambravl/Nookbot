const moment = require('moment');

const timezones = require('../../src/timezones.json');

// eslint-disable-next-line no-unused-vars
module.exports.run = (client, message, args, level) => {
  const tz = args[0] ? args[0].toUpperCase() : 'LINT';
  let offset = timezones[tz];

  if (offset === undefined) {
    offset = 14;
  }

  const timeDif = moment.duration(moment([2020, 2, 20]).diff(moment().add(offset, 'hours').startOf('minute')));

  if (timeDif <= 0) {
    return message.channel.send(`**Animal Crossing: New Horizons** has been released! (UTC${offset >= 0 ? '+' : ''}${offset})`);
  }

  const times = [
    Math.floor(timeDif.asDays()),
    timeDif.hours(),
    timeDif.minutes(),
  ];

  const units = ['day', 'hour', 'minute'];

  const outTimes = client.compareTimes(times, units);

  return message.channel.send(`**Animal Crossing: New Horizons** releases in **${outTimes}**! (UTC${offset >= 0 ? '+' : ''}${offset})`);
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['cd', 'count', 'release'],
  permLevel: 'User',
  blockedChannels: ['538938170822230026', '621925000567455775', '494376688877174785', '651611409272274954'],
};

module.exports.help = {
  name: 'countdown',
  category: 'game',
  description: "Gets the current countdown from AC:NH's release",
  usage: 'countdown <timezone>',
  details: '<timezone> => The timezone to get the countdown for. Ex - EST, GMT, PST, etc.',
};
