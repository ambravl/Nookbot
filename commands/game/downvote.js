module.exports.run = (client, message, args) => {
  // Delete the message to protect those that report users
  message.delete();
  require('../../src/voting').vote(client, message, args);
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['repdown', 'down', 'downrep', '-rep', 'rep-'],
  permLevel: 'User',
  allowedChannels: [client.config.botCommands],
  cooldown: 300,
};

module.exports.help = {
  name: 'downvote',
  category: 'game',
  description: 'Downvotes the mentioned member',
  usage: 'downvote <@member>',
  details: '<@member> => The member you wish to downvote',
};
