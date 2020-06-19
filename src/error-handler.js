
module.exports = (client) => {
  const Discord = require('discord.js');
  client.handle = function (error, method, message) {
    let url;
    if (message) url = `https://discordapp.com/channels/${message.guild.id}/${message.channels.id}/${message.id}`;
    console.error(`Got error ${error.name} while running ${method}`);
    if (url) console.error(`Message link: ${url}`);
    console.error(error.message);
    console.error(error.stack);
    const embed = new Discord.MessageEmbed()
      .setColor('RED')
      .setTitle(error.name)
      .setURL(url ? url : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      .setDescription(error);
    client.channels.cache.get(client.config.actionLog).send(embed)
      .catch((err) => console.error(`Couldn't send message! ${err}`));
  }
};