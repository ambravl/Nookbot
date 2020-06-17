const moment = require('moment');

// eslint-disable-next-line consistent-return
module.exports.run = async (client, message, args, level, Discord) => {
  return require('../../src/nameCheck').nameCheck(client, message, args, Discord, false)
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['un', 'users', 'username'],
  permLevel: 'Redd',
};

module.exports.help = {
  name: 'usernames',
  category: 'info',
  description: 'Displays past usernames for the given user',
  usage: 'usernames <user>',
  details: '<user> => The user to display username information for.',
};
