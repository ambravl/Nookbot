module.exports.run = (client, message, args) => {
  if (!args) return;
  const link = /http.?:..discordapp.com.channels.([0-9]+).([0-9]+).([0-9]+)/.exec(args[0]);
  if (!link) return;
  const msg = message.guild.channels.cache.get(link[1]).messages.fetch(link[2]);
  const emojiRE = /<a?:\w+:([\d]+)([a-zA-Z ]+)>/g;
  let emojiArray;
  client.reactionRoles.insert(link[2], [link[1], 'exclusive'], ['channelID', 'type'])
    .then(() => {
      while ((emojiArray = emojiRE.exec(msg.content) !== null)) {
        const roleID = message.guild.roles.cache.find((r) => r.name === emojiArray[1].trim());
        msg.react(emojiArray[0]);
        client.reactionRoles.push(link[2], {roleID: roleID, emojiID: emojiArray[0]}, 'reactions');
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