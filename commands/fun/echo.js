module.exports.run = (client, message, args, level, Discord) => {
  let channel = message.channel;
  if (level > 3 && args[0].match(/<#\d+>/)) {
    channel = message.mentions.channels.first();
    args.unshift();
  }
  try {
    console.log(args[0]);
    let msg = JSON.parse(JSON.stringify(message.content.replace('.echo', '')));
    console.log(JSON.parse(msg).embed);
    channel.send(JSON.parse(msg).embed)
      .catch((err) => {
        client.handle(err, 'sending parsed echo', message)
      })
  } catch (err) {
    client.error(channel, err.name, err.message);
  }

  //   .setAuthor(message.author.username, message.author.displayAvatarURL());
  //   const regexp = /^(?:(title|color|footer|channel|timestamp|field.+):(.+))|(?:(content|description|text):([\s\S]+))|(?:(url|link): ?(https?:\/\/[^ \n\r]+))|(?:(thumbnail|image|img|icon): ?(https?:\/\/[^ \n\r]+(?:png|gif|jpg|bmp|svg)$))/gmu;
  // const matches = message.content.slice(6).matchAll(regexp);
  // let channel = message.channel;
  // for (let fields of matches) {
  //   if (fields[1]) {
  //     const content = fields[2].trim();
  //     if (['title', 'color', 'footer'].includes(fields[1].toLowerCase())) {
  //       embed[`set${fields[1].toProperCase()}`](content);
  //     } else if (fields[1].startsWith('field')) embed.addField(fields[1].slice(6), content);
  //     else if(fields[1].toLowerCase() === 'timestamp') embed.setTimestamp();
  //     else if (fields[1].toLowerCase() === 'channel' && level > 3) channel = client.channels.cache.get(content);
  //   }
  //   else if (fields[5]) embed.setURL(fields[6]);
  //
  //   else if (fields[3]) embed.setDescription(fields[4].trim());
  // }
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
  usage: 'echo <channel (for mods)> <JSON embed>',
  details: "Go to https://leovoel.github.io/embed-visualizer/ to visualize the embed you're making , then paste the result here!",
};