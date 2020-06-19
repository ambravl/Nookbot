module.exports.run = (client, message, args) => {
  if (!args || args[0].toLowerCase() === 'users') {
    message.guild.members.fetch()
      .then(members => {
        members.each(member => client.userDB.ensure(member.id, 0, 'points'))
      })
      .catch((err) => {
        client.handle(err, 'user update', message)
      });
  }
  if (!args || args[0].toLowerCase() === 'emoji')
    message.guild.emojis.cache.each(emoji => client.emojiDB.ensure(emoji.id, 0, 'uses'))
};

module.exports.conf = {
  guildOnly: true,
  aliases: [],
  permLevel: 'Bot Admin',
};

module.exports.help = {
  name: 'update',
  category: 'system',
  description: 'Updates database in case of dropped or new tables',
  usage: 'update <emoji|users>',
};
