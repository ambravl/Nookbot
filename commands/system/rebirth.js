module.exports.run = (client, message, args, level) => {
  // TODO: add confirmation prompt
  try {
    console.log('Attempting to reset database...');
    client.resetDB();
  } catch(err) {
    throw err;
  }
};

module.exports.conf = {
  guildOnly: false,
  aliases: [],
  permLevel: 'Bot Admin',
};

module.exports.help = {
  name: 'rebirth',
  category: 'system',
  description: 'Completely wipes the current database and creates a new one',
  usage: 'rebirth',
};
