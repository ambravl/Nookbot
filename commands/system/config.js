module.exports.run = (client, message, args) => {
  if (!args || args.legth < 2) client.handle(new Error('wrong argument number'), 'config command', message);
  if (args[0] === 'check' || args[0] === 'c') {
    const msg = [];
    const configList = Object.keys(client.config);
    configList.forEach((config) => {
      msg.push(`**${config}**: ${client.config[config]}`);
    });
    message.channel.send(msg.join('\n'));
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