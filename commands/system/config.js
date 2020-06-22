module.exports.run = (client, message, args) => {
  if (!args || args.legth < 2) return client.handle(new Error('wrong argument number'), 'config command', message);
  if (args[0] === 'check' || args[0] === 'c') {
    const msg = [];
    const configList = Object.keys(client.config);
    configList.forEach((config) => {
      msg.push(`**${config}**: ${client.config[config]}`);
    });
    message.channel.send(msg.join('\n'));
  } else {
    if (args[1] === 'pop') {
      client.configDB.select(args[0], 'config_value')
        .then((res) => {
          client.configDB.update(args[0], res.replace(args[2], '').replace(/, ?,/, ','), 'config_value')
        })
        .catch((err) => {
          client.handle(err, 'popping from config array', message)
        });
      client.config[args[0]].pop(args[2]);
    } else if (args[1] === 'push')
      client.configDB.select(args[0], 'config_value')
        .then((res) => {
          client.configDB.update(args[0], `${res}, ${args[2]}`, 'config_value')
        })
        .catch((err) => {
          client.handle(err, 'pushing to config array', message)
        })
    client.configDB.update(args[0], args[1], 'config_value')
      .then(() => {
        client.config[args[0]] = args[1];
        client.success(message.channel, 'Done!', 'Successfully set that config!')
      })
      .catch((err) => {
        client.handle(err, 'config command', message)
      });
  }
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