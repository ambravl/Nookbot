module.exports.run = async (client, message, args) => {
  const strings = client.mStrings.addRank;
  if (!args || args.length < 2) return client.error(message.channel, strings.none.title, strings.none.desc);
  const role = message.mentions.roles.first();
  if (!role) return client.error(message.channel, strings.noRole.title, strings.noRole.desc);
  const points = args.find(arg => !isNaN(arg));
  if (!points) return client.error(message.channel, strings.noPoints.title, strings.noPoints.desc);
  client.rankDB.safeUpdate(role.id, points, 'minPoints', false)
    .then(() => client.success(message.channel, strings.success.title, strings.success.desc))
    .catch((err) => client.handle(err, 'updating rank DB', message))
};


module.exports.conf = {
  guildOnly: true,
  aliases: ['ar'],
  permLevel: 'Mod',
};

module.exports.help = {
  name: 'addrank',
  category: 'moderation',
  description: 'Adds a new role to the ranking rewards',
  usage: 'addrank <@role> <minPoints>',
};