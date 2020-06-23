
module.exports = (client) => {
  const Discord = require('discord.js');
  client.handle = function (error, method, message) {
    const embed = new Discord.MessageEmbed()
      .setColor('RED')
      .setTitle(`${error.name} while running ${method}`)
      .setDescription(`${error.message}\n\n${error.stack}`);
    if (message) {
      const url = `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
      console.error(`Message link: ${url}`);
      embed.setURL(url);
    }
    console.error(`Got error ${error.name} while running ${method}`);
    console.error(error.message);
    console.error(error.stack);
    client.users.cache.get(client.config.botOwner).createDM().then((channel) => channel.send(embed))
      .catch((err) => console.error(`Couldn't send message! ${err}`));
  }
};