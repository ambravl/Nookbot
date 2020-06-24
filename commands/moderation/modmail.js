// TODO
// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level, Discord) => {
  let command = args.shift().replace(/^(mm|mod|mail)$/, 'modmail').replace('scammer', 'scam');
  const strings = client.mStrings.modMail;
  const reportChannel = client.channels.cache.get(client.config.reportMail);
  const modMailChannel = client.channels.cache.get(client.config.modMail);
  let dmChannel;
  if (message.guild) {
    dmChannel = await message.member.createDM();
    message.delete();
  } else {
    dmChannel = message.channel;
  }
  const open = await client.db.query(`SELECT * FROM modMailDB WHERE memberID = '${message.author.id}' AND (status = 'open' OR status = 'read') AND mailtype = $1`, [command]);
  if (open && open.rows && open.rows[0]) {
    const addInfo = new Discord.MessageEmbed();
    const channel = open.rows[0].mailtype === 'scam' || open.rows[0].mailtype === 'report' ? 'report' : 'modmail';
    const channelID = channel === 'report' ? client.config.reportMail : client.config.modMail;
    const link = `https://discordapp.com/channels/717575621420646432/${channelID}/${open.rows[0].messageid}`;
    addInfo.setAuthor(message.author.username, message.author.displayAvatarURL(), link)
      .setTitle(`Additional information for ticket #${open.rows[0].messageid}!`)
      .setURL(link)
      .setColor('7B68EE')
      .setDescription(message.content)
      .setFooter('click the title to go to the original message!');
    if (channel === 'report') reportChannel.send(addInfo);
    else modMailChannel.send(addInfo);
    client.success(dmChannel, 'Thanks for the message!', 'Your additional information has been sent to the mods!');
    return;
  }
  if (args.length < 2) return client.error(message.channel, strings.none.title, strings.none.desc);
  // noinspection FallThroughInSwitchStatementJS
  if (command === 'dm' || command === 'modmail') {
    const askEmbed = new Discord.MessageEmbed()
      .setTitle(strings[command].title)
      .setDescription(strings[command].desc);
    const promises = [];
    for (let cat in strings) if (strings.hasOwnProperty(cat) && strings[cat].emoji) askEmbed.addField(strings[cat].emoji, strings[cat].name, true);
    const filter = (reaction, user) => {
      if (user.bot) return false;
      for (let cat in strings)
        if (strings.hasOwnProperty(cat) && strings[cat].emoji === reaction.emoji.name) return true
    };
    const getCategory = await dmChannel.send(askEmbed);
    for (let cat in strings) if (strings.hasOwnProperty(cat) && strings[cat].emoji) promises.push(getCategory.react(strings[cat].emoji));
    Promise.all(promises)
      .catch((err) => {
        client.handle(err)
      });
    const collected = await getCategory.awaitReactions(filter, {max: 1, time: 3600000, errors: ['time']});
    const reaction = collected.first();
    for (let cat in strings) if (strings.hasOwnProperty(cat) && strings[cat].emoji === reaction.emoji.name) command = cat;
    if (command === 'cancel') {
      client.success(dmChannel, strings.cancel.title, strings.cancel.desc);
      getCategory.delete();
      return;
    }
  }

  const dmEmbed = new Discord.MessageEmbed()
    .setTitle(strings[command].title)
    .setDescription(strings[command].desc)
    .setColor(strings[command].color)
    // .addField('\u200B', '\u200B')
    // .addField('\u200B', 'You can close this ticket anytime by reacting to this message with ❌')
    .setFooter('Status: Unread')
    .setTimestamp();
  const embed = new Discord.MessageEmbed()
    .setTitle(strings[command].channel)
    .setDescription(args.join(' '))
    .setColor(strings[command].color)
    .setAuthor(message.author.username, message.author.displayAvatarURL(), 'https://discordapp.com/users/' + message.author.id)
    .addField('\u200b', '\u200b')
    .setTimestamp();
  dmChannel.send(dmEmbed)
    .then((sentDM) => {
      // sentDM.react('❌');
      if (command === 'suggestion') {
        embed
          .addField('❎ Downvote', '0', true)
          .addField('✅ Upvote', '0', true)
          .addField('💞 I love it!', '0', true)
          .setFooter('Total Score: --');
        modMailChannel.send(embed)
          .then((sent) => {
            client.suggestions.push(sent.id);
            client.modMailDB.insert(sent.id, [message.author.id, args.join(' '), sentDM.id, 'open', 'suggestion'], ['memberid', 'content', 'dmid', 'status', 'mailtype']);
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
            client.modMailDB.insert(sent.id, [message.author.id, args.join(' '), sentDM.id, 'open', command], ['memberid', 'content', 'dmid', 'status', 'mailtype']);
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
  description: 'Send mail to the mods! Use `.help modmail` to find out how to bypass the menu.',
  usage: 'modmail',
};
