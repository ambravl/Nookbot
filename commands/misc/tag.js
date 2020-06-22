module.exports.run = async (client, message, args, level, Discord) => {
  if (args.length === 0) {
    let listTags = [];
    client.tags.cacheDB()
      .then((tags) => {
        tags.forEach((tag) => {
          listTags.push(tag.tag)
        });

        const embed = new Discord.MessageEmbed()
          .setColor('#1de9b6')
          .setTitle(`Tags (${client.tags.count()})`)
          .setDescription(listTags.join(', ').slice(0, 2000) || 'No tags.')
          .setFooter('Use ".t name" to show a tag');

        message.channel.send(embed);
      })
      .catch((err) => {
        client.handle(err, 'listing tags', message)
      });
    return;
  }
  // Reserved words that cannot be used for tag names
  const reserved = ['create', 'c', 'add', 'make', 'edit', 'e', 'set', 'delete', 'del', 'd', 'remove', 'r'];
  if (reserved.includes(args[0])) {
    if (level < 5) return client.error(message.channel, 'Cannot Edit!', 'You do not have permission to edit tags!');
    if (args.length === 1) return client.error(message.channel, 'No Tag Name!', 'Make sure you include a tag name!');
    if (['delete', 'del', 'd', 'remove', 'r'].includes(args[0])) {
      client.tags.delete(args[1].toLowerCase());
      client.success(message.channel, 'Tag Deleted!', `The tag **${args[1].toLowerCase()}** has been deleted!`);
    } else {
      if (args.length === 2) return client.error(message.channel, 'No Tag Content!', 'Make sure you include the content for the tag!');
      if (reserved.includes(args[1].toLowerCase())) return client.error(message.channel, 'Reserved Word!', "You can't use this word for tags!");
      client.tags.safeUpdate(args[1].toLowerCase(), args.slice(2).join(' '), 'content')
        .then(() => {
          client.success(message.channel, 'Tag Modified!', `The tag **${args[1].toLowerCase()}** has been modified!`);
        })
        .catch((err) => {
          client.handle(err, 'tag modification', message)
        });
    }
  } else {
    client.tags.levenshtein(args[0].toLowerCase(), 'content')
      .then((tag) => {
        if (tag) {
          message.channel.send(tag.content);
        } else client.error(message.channel, 'Tag Does Not Exist!', 'The tag you attempted to display does not exist!');
      })
      .catch((err) => {
        client.handle(err, 'sending tag content', message)
      });
  }
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['t'],
  permLevel: 'User',
};

module.exports.help = {
  name: 'tag',
  category: 'misc',
  description: 'Get, create, or list tags',
  usage: 'tag <create|edit|delete> <tag name> <content>',
  details: '<create|edit|delete> => Whether to create a new tag or edit/delete an existing one.\n<tag name> => The name of the tag you want to create/edit/delete.\n<content> => The content for the tag you want to create or edit.',
};
