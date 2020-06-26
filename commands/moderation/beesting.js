module.exports.run = async (client, message, args, level, Discord) => {
  const stinger = require('../../src/stinger');
  let member;
  if (parseInt(args[0], 10)) {
    try {
      member = await client.users.fetch(args[0]) || message.mentions.members.first();
    } catch (err) {
      client.handle(err, 'fetching member to sting', message);
    }
  }
  // If no user mentioned, display this
  if (!member) {
    return client.error(message.channel, 'Invalid Member!', 'Please mention a valid member of this server!');
  }

  const newPoints = parseInt(args[1], 10);

  if (newPoints < 0) {
    return client.error(message.channel, 'Invalid Number!', 'Please provide a valid number for the stings to give!');
  }

  const reason = args[2] ? args.slice(2).join(' ') : 'No reason given.';

  let curPoints = 0;
  const infractions = await client.userDB.ensure(member.id, '', 'infractions');
  infractions.forEach((infraction) => {
    curPoints += infraction.points;
  });
  const punishment = await stinger.sting(curPoints, newPoints, reason, member);
  // Create infraction in the infractions to get case number
  const caseNum = await client.infractions.add(member.id);

  // Create infraction in the users to store important information
  const infraction = {
    case: caseNum.rows[0].casenumber,
    action: punishment.action,
    points: newPoints,
    reason: `${reason}${message.attachments.size > 0 ? `\n${message.attachments.map((a) => `${a.url}`).join('\n')}` : ''}`,
    moderator: message.author.id
  };

  client.userDB.push(member.id, infraction, 'infractions');

  // Perform the required action
  if (punishment.action === 'ban') {
    await message.guild.members.ban(member, {reason: '[Auto] Beestings', days: 1}).catch((err) => {
      client.error(message.guild.channels.cache.get(client.config.modLog), 'Ban Failed!', `I've failed to ban this member! ${err}`);
    });
  } else if (punishment.action === 'mute') await stinger.muter(client, member, message, punishment.length);


  // Notify in channel
  client.success(message.channel, 'Bee Sting Given!', `**${member.guild ? member.user.tag : member.tag || member}** was given **${newPoints}** bee sting${newPoints === 1 ? '' : 's'}!`);

  // Send mod-log embed
  const embed = new Discord.MessageEmbed()
    .setAuthor(`Case ${caseNum.rows[0].casenumber} | ${action} | ${member.guild ? member.user.tag : member.tag || member}`, member.guild ? member.user.displayAvatarURL() : member.displayAvatarURL())
    .setColor((mute || ban) ? '#ff9292' : '#fada5e')
    .setDescription(`Reason: ${reason}`)
    .addField('User', `<@${member.id}>`, true)
    .addField('Moderator', `<@${message.author.id}>`, true)
    .addField('Stings Given', newPoints, true)
    .addField('Total Stings', curPoints + newPoints, true)
    .setFooter(`ID: ${member.id}`)
    .setTimestamp();
  return message.guild.channels.cache.get(client.config.modLog).send(embed);
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['bee', 'bs', 'sting'],
  permLevel: 'Redd',
  args: 2,
};

module.exports.help = {
  name: 'beesting',
  category: 'moderation',
  description: 'Manage bee stings on server members.',
  usage: 'beesting <@member> <stings> <reason>',
  details: '<@member> The member to give a bee sting.\n<stings> => The number of stings to give the member.\n<reason> => The reason for giving the member the bee sting.',
};
