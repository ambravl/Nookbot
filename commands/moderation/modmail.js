// TODO
// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level, Discord) => {
  const strings = client.mStrings.modMail;
  if (message.guild) {
    message.delete().catch((err) => console.error(err));
  }
  const embed = new Discord.MessageEmbed()
    .setAuthor(message.author.name, message.author.displayAvatarURL())
    .setTitle(`Ticket #${message.id}`)
    .setDescription(message.content)
    .setColor('#ff0000')
    .addField('\u200b', '\u200b')
    .setFooter(`Status: not replied`);
  if (message.attachments) embed.attachFiles(message.attachments);
  message.guild.channels.cache.get(client.config.modMail).send(message.content)
    .then((msg) => {
      const dmMsg = new Discord.MessageEmbed()
        .setTitle(strings.thanks.title)
        .setDescription('\n' + strings.thanks.desc)
        .setColor('#4dab68');
      message.member.createDM().then((dmChannel) => {
        dmChannel.send(dmMsg)
          .then((dm) => {
            client.modMail.insert(msg.id, [message.author.id, dm.id, 'unread'], ['memberID', 'dmID', 'status'])
              .catch((err) => client.handle(err, 'adding modmail to the db', message))
          })
          .catch((err) => client.handle(err, 'sending DM to modmail sender', message))
      })
        .catch((err) => client.handle(err, 'opening DM channel with modmail sender', message));
    })
    .catch((err) => client.handle(err, 'sending modmail to channel'))
};

module.exports.conf = {
  guildOnly: false,
  aliases: ['mod', 'mail', 'mm'],
  permLevel: 'User',
  cooldown: 60,
};

module.exports.help = {
  name: 'modmail',
  category: 'moderation',
  description: 'Modmail is no longer done through Nookbot, please send your mail to Orvbot at the top of the server list',
  usage: 'modmail',
};
