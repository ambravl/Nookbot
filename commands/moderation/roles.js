module.exports.run = (client, message, args) => {
  const emojiRE = /(?:([^\x32-\x7F])|<:\w+:(\d+)>)[\W ]+([\w ']+)/gu;
  if (!args) return;
  const link = /http.?:..discord(?:app)?.com.channels.([0-9]+).([0-9]+).([0-9]+)/.exec(args[0]);
  const roleType = 2 === args.length ? args[1] : 'exclusive';
  if (!link) return;
  client.channels.cache.get(link[2]).messages.fetch(link[3])
    .then((msg) => {
      const matches = msg.content.matchAll(emojiRE);
      let reactions = [];
      if (roleType.toLowerCase() === 'verified') {
        reactions.push({roleID: client.config.verified, emojiID: client.config.verifiedEmoji});
        msg.react(client.config.verifiedEmoji)
          .catch((err) => {
            client.handle(err, 'reacting with verified emoji', message)
          })
      } else {
        for (const match of matches) {
          const emojiID = match[1] ? match[1] : match[2];
          if (emojiID && match[3]) {
            console.log(match[3]);
            const roleID = message.guild.roles.cache.find((r) => r.name.toLowerCase() === match[3].trim().toLowerCase()).id;
            reactions.push({roleID: roleID, emojiID: emojiID});
            msg.react(emojiID)
              .then(() => {
              })
              .catch((err) => {
                client.handle(err, 'reactionRole setup reaction', message)
              });
          }
        }
      }
      client.reactionRoles.insert(link[3], [link[2], roleType, reactions], ['channelID', 'type', 'reactions'])
        .then(() => {
          client.success(message.channel, 'Done!', 'Successfully set up reaction roles!')
        })
        .catch((err) => {
          client.handle(err, 'reactionRole setup insertion', message)
        });

    })
    .catch((err) => {
      client.handle(err, 'reactionRole setup', message)
    });
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