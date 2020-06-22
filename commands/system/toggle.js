module.exports.run = (client, message, args) => {
  if (!args[0]) return client.error(message.channel, 'Wrong argument number!', 'You need to provide a command to disable!');
  const command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
  if (command) {
    if (command.help.category === 'system') return client.error(message.channel, 'Forbidden', "You can't disable this command!");
    else {
      client.enabledCommands.update(command.help.name, 'false', 'enabled')
        .then(() => {
          client.commands.delete(command.help.name);
        })
    }
  } else {
    client.enabledCommands.update(args[0], 'true', 'enabled')
      .then(() => {
        client.commands.set(command.help.name, require(`../../commands/${command.help.category}/${command.help.name}`));
        client.success(message.channel, 'Enabled!', `${args[0]} was successfully enabled!`)
      })
      .catch((err) => client.error(message.channel, err, `Command ${args[0]} was not found!`));
  }
};


module.exports.conf = {
  guildOnly: false,
  aliases: ['toggle', 'enable', 'disable'],
  permLevel: 'Head Mod'
};

module.exports.help = {
  name: 'toggle',
  category: 'system',
  description: 'Enables or disables a command.',
  usage: 'toggle <command name>'
};