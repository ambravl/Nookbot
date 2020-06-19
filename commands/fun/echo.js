module.exports.run = (client, message, args, level, Discord) => {
  const embed = new Discord.MessageEmbed();
  const regexp = /^(?:(title|color|footer|field.+):(.+))|(?:content:([^]+))|(?:(?:url|link): ?(https?:\/\/[^ \n\r]+))/gm;
  const fields = message.content.slice(6).matchAll(regexp);
  let channel = message.channel;
  for (let field of fields) {
    if (fields[1]) {
      const content = fields[2].trim();
      if (['title', 'color', 'footer'].includes(fields[1])) embed[`set${fields[1].toProperCase()}`](content);
      else if (fields[1].startsWith('field')) embed.addField(fields[1].slice(6), content);
      else if (fields[1] === 'channel' && level > 3) channel = client.channels.cache.get(content);
    } else if (fields[5]) embed.setURL(fields[6]);
    else if (fields[3]) embed.setDescription(fields[4].trim());
  }
  channel.send(embed);
};

module.exports.conf = {
  guildOnly: true,
  aliases: [],
  permLevel: 'User',
  allowedChannels: true,
};

module.exports.help = {
  name: 'echo',
  category: 'fun',
  description: 'Repeats what the user said, but in a fancy embed',
  usage: 'echo <field>: <text>',
  details: 'ill write something here someday',
};