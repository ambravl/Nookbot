// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level) => {
  // Sets the role to the Muted role
  const role = message.guild.roles.cache.find((r) => r.name === 'Muted');

  // Sets the member to the user mentioned
  let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

  if (!member) {
    if (parseInt(args[0], 10)) {
      try {
        member = await message.guild.members.fetch(args[0]);
      } catch (err) {
        // Don't need to send a message here
      }
    }
  }

  // If no user mentioned, display this
  if (!member) {
    return client.error(message.channel, 'Invalid Member!', 'Please mention a valid member of this server!');
  }

  // Removes the role from the member and deletes the message that initiated the command
  member.roles.remove(role).catch((err) => console.error(err));
  message.delete().catch((err) => console.error(err));
  return message.channel.send(`Successfully unmuted ${member}!`).catch((err) => console.error(err));
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['um'],
  permLevel: 'Redd',
  args: 1,
};

module.exports.help = {
  name: 'unmute',
  category: 'moderation',
  description: 'Removes the mentioned user the Muted role',
  usage: 'unmute <@user>',
  details: '<@user> => Any valid member of the server',
};
