module.exports.run = async (client, message) => {
  const Discord = require('discord.js');
  const pass = require('../../src/passport/passport').Passport;
  const passport = new pass({
    icon: message.author.displayAvatarURL({format: 'jpg'}),
    username: message.author.username,
    island: 'Isle Name',
    fruit: 'Oranges',
    friendcode: 'SW-0123-4567-8910',
    switchName: 'Switch UN',
    characterName: 'Char Name',
    rank: 4000,
    userCount: 4000,
    role: 'Role Name',
    points: 9999,
    nextRole: 20000,
    hemisphere: 'Southern',
    bio: "Bio here",
    color: "#9600ff",
    joined: 'March 20th, 2020'
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
