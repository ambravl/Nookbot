module.exports.run = (client, message, args, level) => {
  let channel = message.channel;
  if (level > 3 && args[0].match(/<#\d+>/)) {
    channel = message.mentions.channels.first();
    args.unshift();
  }
  try {
    let msg = JSON.parse(JSON.stringify(args.join(' ')));
    if (message.attachments) options.files = [message.attachments.first()];
    channel.send({embed: JSON.parse(msg).embed})
      .catch((err) => {
        client.handle(err, 'sending parsed echo', message)
      })
  } catch (err) {
    client.error(channel, err.name, err.message);
  }
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