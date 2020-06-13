module.exports.run = (client, message, args, level) => {
  // TODO: add confirmation prompt
  // TODO: remove finally, it should only exist in the very first run of this command
  try {
    console.log('Attempting to delete database...');
    console.log(client.drop);
  } catch(err) {
    throw err;
  }finally{
  console.log("Attempting to create database...");
  console.log(client.create);}
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
