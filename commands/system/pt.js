module.exports.run = async (client, message) => {
  const Discord = require('discord.js');
  const pass = require('../../src/passport/passport').Passport;
  const passport = new pass({
    icon: message.author.displayAvatarURL(),
    username: message.author.username,
    island: 'WWWWWWWWWW',
    fruit: 'Oranges',
    friendcode: 'SW-0123-4567-8910',
    switchName: 'WWWWWWWWWW',
    characterName: 'WWWWWWWWWW',
    rank: 4000,
    userCount: 4000,
    role: 'Lily of the Valley',
    points: 9999,
    nextRole: 10000,
    hemisphere: 'Southern',
    bio: `What's a queen to a dog?`
  });
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
