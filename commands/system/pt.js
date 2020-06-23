module.exports.run = async (client, message, args) => {
  const pass = require('../../src/passport/passport').Passport
  const passport = new pass({});
  passport.draw().then((image) => {
    message.channel.send({files: [new Discord.MessageAttachment(image)]})
  })
};

module.exports.conf = {
  guildOnly: false,
  aliases: [],
  permLevel: 'User',
  allowedChannels: false,
};

module.exports.help = {
  name: 'pt',
  category: 'system',
  description: 'Profile information display',
  usage: 'profile <bio|background|islandname|fruit|charactername|hemisphere|profilename|friendcode> <bio|backgrounddurl|name|fruit|hemisphere|code>',
  details: '<islandname> => Set the name of your \n<fruit> => Set the fruit that is native on your \n<charactername> => Set the name of your character on the \n<hemisphere> => Set the hemisphere your island is in.\n<profilename> => Set the name of your Switch profile.\n<friendcode> => Set your Switch friendcode.',
};
