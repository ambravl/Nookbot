module.exports.run = (client, message, args) => {
  if (!args || args.legth < 2) client.handle(new Error('wrong argument number'), 'config command', message);
  if (args[0] === 'check' || args[0] === 'c') {
    const Discord = require('discord.js');
    const embed = new Discord.MessageEmbed().setTitle('Configurations');
    const configList = Object.keys(client.config);
    let configs = [];
    configList.forEach((config) => {
      embed.addField(config, client.config[config], true);
    });
    message.channel.send(embed);
  }
  client.configDB.update(args[0], args[1], 'config_value')
    .then(() => {
      client.config[args[0]] = args[1]
    })
    .catch((err) => {
      client.handle(err, 'config command', message)
    });
};


module.exports.conf = {
  guildOnly: false,
  aliases: ['cfg'],
  permLevel: 'Head Mod'
};

module.exports.help = {
  name: 'config',
  category: 'system',
  description: 'Changes a configuration value',
  usage: 'config <config name> <config value>'
};