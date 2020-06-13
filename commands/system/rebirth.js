module.exports.run = (client, message, args, level) => {
  // TODO: add confirmation prompt
  try {
    console.log('Attempting to delete database...');
    console.log(client.drop);
  } catch(err) {
    throw err;
  }
  console.log("Attempting to create database...");
  console.log(client.create);
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
