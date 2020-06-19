// eslint-disable-next-line consistent-return
// UGLY: maybe extract methods?
module.exports.run = async (client, message, args, level, Discord) => {
  const strings = client.mStrings.friendCode;
  switch (args[0]) {
    case 'set':
    case 'add':
      if (args.length === 1) {
        return client.error(message.channel, strings.noCode.title, strings.noCode.desc);
      }

      let code = args.slice(1).join().replace(/[\D]/g, '');

      if (code.length !== 12) {
        return client.error(message.channel, strings.invalidCode.title, strings.invalidCode.desc);
      }

      code = `SW-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
      client.userDB.safeUpdate(message.author.id, code, 'friendCode')
        .catch((err) => {client.handle(err, 'adding friend code')});

      const name = await client.userDB.select(message.author.id, 'profileName');

      const successEmbed = new Discord.MessageEmbed()
        .setAuthor(`${message.member.displayName}'s Friend Code`, message.author.displayAvatarURL())
        .setTitle(strings.successful)
        .setColor('#e4000f')
        .setDescription(`**${code}**${name ? `\nSwitch Profile Name: **${name}**` : ''}`);

      return message.channel.send(successEmbed);
    case 'del':
    case 'delete':
    case 'remove':
      client.userDB.update(message.author.id, '', 'friendCode')
        .catch((err) => {client.handle(err, 'removing friend code that might not exist')});
      client.success(message.channel, strings.successfulDelete.title, strings.successfulDelete.desc);
      break;
    default:
      const ownFC = args.length === 0;
      const member = ownFC ? message.author : message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        client.searchMember(args.join(' '));

      const foundUser = await client.userDB.ensure(member.id, '', '*');

      if(!foundUser) return client.error(message.channel, strings.unknownMember.title, strings.unknownMember.desc);
      if(!foudUser.friendCode) return client.error(
        message.channel,
        strings.noCode.title,
        args.length === 0 ? strings.noCode.s : `${foundUser.displayName} ${strings.noCode.u}`
      );
      const foundEmbed = new Discord.MessageEmbed()
        .setAuthor(
          `${ownFC ? message.member.displayName : member.displayName}'s Friend Code`,
          ownFC ? member.displayAvatarURL() : member.user.displayAvatarURL()
        )
        .setColor('#e4000f')
        .setDescription(
          `**${foundUser.friendCode}**${foundUser.profileName ? `\n
          Switch Profile Name: **${foundUser.profileName}**` : ''}`
        );

      return message.channel.send(foundEmbed);
    }
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['fc'],
  permLevel: 'User',
  blockedChannels: [
    '538938170822230026',
    '494376688877174785',
    '661330633510879274',
    '651611409272274954',
    '494467780293427200',
    '669696796024504341',
    '690093605821480980',
    '699035146153623642',
  ],
};

module.exports.help = {
  name: 'friendcode',
  category: 'game',
  description: 'Switch friend code management',
  usage: 'friendcode <set|del> <code|@member>',
  details: "<set|del> => Whether to set a new friend code or delete an existing one.\n<code|@member> => Only necessary if you're setting a new code or getting the code of another member.",
};
