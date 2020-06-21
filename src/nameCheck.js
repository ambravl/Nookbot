const moment = require('moment');

// eslint-disable-next-line consistent-return
module.exports.nameCheck = async (client, message, args, Discord, nick) => {
  const u = nick ? 'nick' : 'user';
  let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || client.searchMember(args.join(' '));

  if (!member) {
    member = args[0] ? {id: args[0]} : message.member;
  }
  const result = await client.userDB.select(member.id, u + 'names');
  if (result === undefined) return client.error(message.channel, 'Member Not Found!', 'This member may have left the server or the id provided is not a member id!');
  let nameArray = [];
  if (result) result.forEach((pair) => {
    nameArray.unshift(`${moment.utc(pair.timestamp).format('DD MMM YY HH:mm')} UTC: ${pair[u + 'names']}`)
  });
  let currentPage = 1;
  const maxPage = Math.ceil(nameArray.length / 15) || 1;
  const embed = new Discord.MessageEmbed()
    .setTitle(`Past ${u}names of ${member.user ? member.user.tag : member.id}`)
    .setDescription(`\`\`\`${nameArray.slice(0, 15).join('\n') || 'No stored names.'}\`\`\``)
    .setFooter(`Page ${currentPage}/${maxPage}`)
    .setTimestamp();

  const infoMessage = await message.channel.send(embed);
  if (nameArray.length > 15) {
    await infoMessage.react('⬅️');
    await infoMessage.react('➡️');
    const filter = (reaction, user) => (reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️') && !user.bot;
    const collector = infoMessage.createReactionCollector(filter, {time: 120000});
    collector.on('collect', (r) => {
      if (r.emoji.name === '⬅️' && currentPage !== 1) {
        currentPage -= 1;
        embed.setDescription(`\`\`\`${nameArray.slice((currentPage - 1) * 15, currentPage * 15).join('\n')}\`\`\``);
        embed.setFooter(`Page ${currentPage}/${maxPage}`);
        infoMessage.edit(embed);
      } else if (r.emoji.name === '➡️' && currentPage !== maxPage) {
        currentPage += 1;
        embed.setDescription(`\`\`\`${nameArray.slice((currentPage - 1) * 15, currentPage * 15).join('\n')}\`\`\``);
        embed.setFooter(`Page ${currentPage}/${maxPage}`);
        infoMessage.edit(embed);
      }
    });
    collector.on('end', () => {
      embed.setFooter('No longer listening to reactions.');
      infoMessage.reactions.removeAll();
      infoMessage.edit(embed);
    });
  }
};