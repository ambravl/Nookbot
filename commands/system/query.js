module.exports.run = async (client, message, args) => {
  const query = {
    text: args.join(' '),
    rowMode: 'array'
  };
  client.db.query(query)
    .then((res) => {
      if (res && res.rows && res.rows.length > 0) {
        let msg = [`**${res.fields.map(f => f.name).join(' | ')}**`];
        res.rows.forEach((row) => {
          msg.push(row.join(' | '));
        });
        message.channel.send(msg.join('\n'));
      } else {
        if (res.command.toUpperCase() === 'SELECT') client.error(message.channel, 'No results!', 'There were no results for your query...');
        else client.success(message.channel, 'Done!', "Whatever it was, it's done now!")
      }
    })
    .catch((err) => {
      client.handle(err)
    });
};

module.exports.conf = {
  guildOnly: false,
  aliases: ['postgres', 'pg'],
  permLevel: 'Bot Admin',
  cooldown: 60,
};

module.exports.help = {
  name: 'query',
  category: 'system',
  description: 'Runs a query in the bots databases',
  usage: 'query <query>',
};