// eslint-disable-next-line no-unused-vars
module.exports.run = (client, message, args) => {
  require('../../src/voting').vote(client, message, args, true)
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['repup', 'up', 'uprep', '+rep', 'rep+'],
  permLevel: 'User',
  allowedChannels: [client.config.botCommands],
  cooldown: 300,
};

module.exports.help = {
  name: 'upvote',
  category: 'game',
  description: 'Upvotes the mentioned member',
  usage: 'upvote <@member>',
  details: '<@member> => The member you wish to upvote',
};
