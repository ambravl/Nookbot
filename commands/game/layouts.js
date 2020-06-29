module.exports.run = async (client, message, args, level, Discord) => {
  const flowchart = require('../../src/flowchart.json');
  const strings = client.mStrings.layouts;
  const channel = message.guild ? await message.member.createDM() : message.channel;
  if (!channel) return;
  let currentName = "start";
  let current = flowchart.start;
  let next = Object.keys(current);
  let nextEmojis = next.map((step) => {
    return strings[step].emoji
  });
  const filter = (reaction, user) => {
    return nextEmojis.includes(reaction.emoji.name) && !user.bot
  };
  while (next) {
    const embed = new Discord.MessageEmbed()
      .setTitle(strings[currentName].title)
      .setDescription(strings[currentName].desc)
      .addFields(next.map((nextStep) => {
        return {name: strings[nextStep].title, value: strings[nextStep].desc, inline: true}
      }));
    const msg = await channel.send(embed);
    nextEmojis.forEach((emoji) => {
      msg.react(emoji)
    });
    const reaction = await msg.awaitReactions(filter, {
      max: 1,
      time: 3600000,
      errors: ['time']
    }).catch(() => client.error('Timed out!'));
    console.log(reaction);
    const decision = next.find((step) => strings[step].emoji === reaction.first().emoji.name);
    if (Object.keys(current[decision])) {
      currentName = Object.keys(current[decision])[0];
      console.log(current);
      current = current[decision][currentName];
      next = Object.keys(current);
      nextEmojis = next.map((step) => {
        return strings[step].emoji
      });
    } else {
      current = current[decision];
      next = null;
    }
  }
  const layout = new Discord.MessageEmbed()
    .setTitle(strings[current].title)
    .setDescription(strings[current].desc)
    .setURL(strings[current].link)
    .attachFiles(strings[current].image);
  channel.send(layout);
};

module.exports.conf = {
  guildOnly: false,
  aliases: ['layout', 'layouts', 'garden', 'gardens', 'lay', 'ly'],
  permLevel: 'User',
  allowedChannels: false,
  cooldown: 300,
};

module.exports.help = {
  name: 'layouts',
  category: 'game',
  description: 'Leif will help you choose a garden layout!',
  usage: 'layouts'
};
