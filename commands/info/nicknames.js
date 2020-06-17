const moment = require('moment');

// eslint-disable-next-line consistent-return
module.exports.run = async (client, message, args, level, Discord) => {
 return require('../../src/nameCheck').nameCheck(client, message, args, Discord, true)
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['nn', 'nicks', 'nickname'],
  permLevel: 'Redd',
};

module.exports.help = {
  name: 'nicknames',
  category: 'info',
  description: 'Displays past nicknames for the given user',
  usage: 'nicknames <user>',
  details: '<user> => The user to display nickname information for.',
};
