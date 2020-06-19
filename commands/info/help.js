// FIXME
module.exports.run = (client, message, [command], level) => {
  if (command) {
    if (client.commands.has(command) || client.aliases.has(command)) {
      const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

      let output = `= ${cmd.help.name} = \n${cmd.help.description}\n\nUsage :: ${client.config.prefix}${cmd.help.usage}`;

      if (cmd.conf.aliases) {
        output += `\nAliases :: ${cmd.conf.aliases.join(', ')}`;
      }

      if (cmd.help.details) {
        output += `\nDetails :: ${cmd.help.details}`;
      }

      output += `\nPerm Level :: ${cmd.conf.permLevel}`;

      message.channel.send(output, {code: 'asciidoc'});
    } else {
      client.error(message.channel, 'Invalid Command!', `All valid commands can be found by using \`${client.config.prefix}help\`!`);
    }
  } else {
    let levels = client.levelCache.map((cmd) => cmd.name);
    console.log(levels);
    console.log(level);
    let commands = client.commands.filter((cmd) => levels.indexOf(cmd.conf.permLevel) <= level);

    if (!message.guild) {
      commands = client.commands.filter((cmd) => levels.indexOf(cmd.conf.permLevel) <= level
        && cmd.conf.guildOnly === false);
    }

    const commandNames = commands.keyArray();
    const longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);

    let currentCategory = '';
    let output = `= Command List =\n\n[Use ${client.config.prefix}help <command name> for details]\n`;

    // eslint-disable-next-line no-nested-ternary
    const sorted = commands.array().sort((p, c) => (p.help.category > c.help.category ? 1
      : p.help.name > c.help.name && p.help.category === c.help.category ? 1 : -1));
    sorted.forEach((c) => {
      const cat = c.help.category.toProperCase();
      if (currentCategory !== cat) {
        output += `\u200b\n== ${cat} ==\n`;
        currentCategory = cat;
      }
      output += `${client.config.prefix}${c.help.name}${' '.repeat(longest - c.help.name.length)} :: ${c.help.description}\n`;
    });
    message.channel.send(output, {code: 'asciidoc', split: {char: '\u200b'}});
  }
};

module.exports.conf = {
  guildOnly: false,
  aliases: ['h', 'halp', 'commands', 'cmds'],
  permLevel: 'User',
};

module.exports.help = {
  name: 'help',
  category: 'info',
  description: 'Displays all commands available for your permission level',
  usage: 'help <command>',
};
