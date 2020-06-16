
module.exports = (client) => {
  client.handle = function(error, method, Discord, message) {
    let url;
  if(message) url = `https://discordapp.com/channels/${message.guild.id}/${message.channels.id}/${message.id}`;
  console.error(`Got error ${error.name} while running ${method}`);
  if(url) console.error(`Message link: ${url}`);
  console.error(error.message);
  console.error(error.stack);
  if(Discord) {
    const embed = new Discord.MessageEmbed()
      .setColor('RED')
      .setTitle(error.name)
      .setURL(url ? url : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      .setDescription(error)
      .catch((err) => console.error(`Couldn't write message... ${err}`));
    client.channels.cache.get('720568062490705931').send(embed)
      .catch((err) => console.error(`Couldn't send message! ${err}`));
  }
  }
};