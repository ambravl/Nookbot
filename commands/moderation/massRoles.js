module.exports.run = (client, message, args) => {
  if (!args) return client.error(message.channel, 'No role mentioned!', 'You need to mention the role!');
  const role = message.mentions.roles.first();
  message.guild.members.fetch().then(fetchedMembers => {
    try {
      fetchedMembers.each((member) => {
        member.roles.add(role).catch((err) => {
          throw err
        })
      })
    } catch (err) {
      client.handle(err, 'adding roles', message)
    }
  })
};


module.exports.conf = {
  guildOnly: true,
  aliases: [],
  permLevel: 'Mod',
  args: 1,
};

module.exports.help = {
  name: 'roles',
  category: 'moderation',
  description: 'Makes it so Leif listens to reactions to a message and assigns roles accordingly',
  usage: 'roles <link>',
  details: "<link> => The link to the message listing roles.",
};