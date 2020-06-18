module.exports.run = (client, message, args) => {
  if (!args) return;
  const link = /http.?:..discordapp.com.channels.([0-9]+).([0-9]+).([0-9]+)/.exec(args[0]);
  const roleType = args.length === 2 ? args[1] : 'exclusive';
  const emojiRE = /(?:([^\x00-\x7F])|<:\w+:(\d+)>).+?([\w ']+)/gu;
  if (!link) return;
  client.channels.cache.get(link[2]).messages.fetch(link[3])
    .then((msg) => {
      const matches = msg.content.matchAll(emojiRE);
      let reactions = [];
      for (const match of matches) {
        const emojiID = match[1] ? match[1] : match[2];
        if (emojiID && match[3]) {
          const roleID = message.guild.roles.cache.find((r) => r.name.toLowerCase() === match[3].trim().toLowerCase()).id;
          reactions.push(`'${JSON.stringify({roleID: roleID, emojiID: emojiID})}'`);
          msg.react(emojiID)
            .then(() => {
              console.log(`reacted with ${emojiID}`);
            })
            .catch((err) => {
              client.handle(err, 'reactionRole setup reaction', message)
            });
        }
      }
      client.reactionRoles.insert(link[3], [link[2], roleType, `{${reactions.join(", ")}}`], ['channelID', 'type', 'reactions'])
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