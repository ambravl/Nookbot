// TODO
// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level, Discord) => {
  const strings = client.mStrings.modMail;
  if (args.length < 2) return client.error(message.channel, strings.none.title, strings.none.desc);
  const reportChannel = client.channels.cache.get(client.config.reportMail);
  const modMailChannel = client.channels.cache.get(client.config.modMail);
  console.log(message.guild);
  const dmChannel = message.guild ? await message.member.createDM() : message.channel;
  let command = args.shift().replace(/^(mm|mod|mail)$/, 'modmail').replace('scammer', 'scam');
  // noinspection FallThroughInSwitchStatementJS
  if (command === 'dm' || command === 'modmail') {
    const askEmbed = new Discord.MessageEmbed()
      .setTitle(strings[command].title)
      .setDescription(strings[command].desc);
    const promises = [];
    for (let cat in strings) if (strings.hasOwnProperty(cat) && strings[cat].emoji) askEmbed.addField(strings[cat].emoji, strings[cat].name, true);
    const filter = (reaction) => {
      for (let cat in strings)
        if (strings.hasOwnProperty(cat) && strings[cat].emoji === reaction.emoji.name) return true
    };
    const getCategory = await dmChannel.send(askEmbed);
    for (let cat in strings) if (strings.hasOwnProperty(cat) && strings[cat].emoji) promises.push(getCategory.react(strings[cat].emoji));
    Promise.all(promises)
      .catch((err) => {
        client.handle(err)
      });
    const collected = await confirm.awaitReactions(filter, {max: 1, time: 3600000, errors: ['time']});
    const reaction = collected.first();
    for (let cat in strings) if (strings.hasOwnProperty(cat) && strings[cat].emoji === reaction.emoji.name) command = cat;
    if (command === 'cancel') {
      client.success(dmChannel, strings.cancel.title, strings.cancel.desc);
      return;
    }
  }

  const dmEmbed = new Discord.MessageEmbed()
    .setTitle(strings[command].title)
    .setDescription(strings[command].desc)
    .setColor(strings[command].color)
    .setFooter('Status: Unread')
    .setTimestamp();
  const embed = new Discord.MessageEmbed()
    .setTitle(strings[command].channel)
    .setDescription(message.content)
    .setColor(strings[command].color)
    .setAuthor(message.author.username, message.author.displayAvatarURL(), 'https://discordapp.com/users/' + message.author.id)
    .addField('\u200b', '\u200b')
    .setTimestamp();
  dmChannel.send(dmEmbed)
    .then((sentDM) => {
      if (command === 'suggestion') {
        embed
          .addField('❎ Downvote', '0', true)
          .addField('✅ Upvote', '0', true)
          .addField('💞 I love it!', '0', true)
          .setFooter('Total Score: --');
        modMailChannel.send(embed)
          .then((sent) => {
            client.suggestions.push(sent.id);
            client.modMailDB.insert(sent.id, [message.author.id, message.content, sentDM.id, 'open', 'suggestion'], ['memberid', 'content', 'dmid', 'status', 'mailtype']);
            sent.react('❎');
            sent.react('✅');
            sent.react('💞');
          })
          .catch((err) => {
            client.handle(err, 'sending suggestion to channel')
          })
      } else {
        embed
          .addField('❕', 'I Got This!', true)
          .addField('✅', 'Mark Complete', true)
          .setFooter('Ticket opened at');
        const channel = (command === 'report' || command === 'scam') ? reportChannel : modMailChannel;
        channel.send(embed)
          .then((sent) => {
            client.modMail[sent.id] = 'unread';
            client.modMailDB.insert(sent.id, [message.author.id, message.content, sentDM.id, 'open', command], ['memberid', 'content', 'dmid', 'status', 'mailtype']);
            sent.react('❕');
            sent.react('✅');
          })
          .catch((err) => {
            client.handle(err, 'sending modmail to channel')
          });
      }
    })
    .catch((err) => {
      client.handle(err, 'sending modmail reply to DM')
    });

};

module.exports.conf = {
  guildOnly: false,
  aliases: ['mod', 'mail', 'mm', 'report', 'scam', 'suggestion', 'scammer', 'question'],
  permLevel: 'User',
  cooldown: 60,
};

module.exports.help = {
  name: 'modmail',
  category: 'moderation',
  description: 'Modmail is no longer done through Nookbot, please send your mail to Orvbot at the top of the server list',
  usage: 'modmail',
};
