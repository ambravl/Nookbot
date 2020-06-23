module.exports.run = async (client, message, args, level, Discord) => {
  const st = client.mStrings.tags;
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
          .setFooter(st.usage);

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
    if (level < 5) return client.error(message.channel, st.noEdit.title, st.noEdit.desc);
    if (args.length === 1) return client.error(message.channel, st.noName.title, st.noName.desc);
    if (['delete', 'del', 'd', 'remove', 'r'].includes(args[0])) {
      client.tags.delete(args[1].toLowerCase());
      client.success(message.channel, st.deleted.title, st.deleted.descL + args[1].toLowerCase() + st.deleted.descR);
    } else {
      if (args.length === 2) return client.error(message.channel, st.noContent.title, st.noContent.desc);
      if (reserved.includes(args[1].toLowerCase())) return client.error(message.channel, st.reserved.title, st.reserved.desc);
      client.tags.safeUpdate(args[1].toLowerCase(), args.slice(2).join(' '), 'content', false)
        .then(() => {
          client.success(message.channel, st.modified.title, st.modified.descL + args[1].toLowerCase() + st.modified.descR);
        })
        .catch((err) => {
          client.handle(err, 'tag modification', message)
        });
    }
  } else {
    client.tags.levenshtein(args[0].toLowerCase(), 'tag')
      .then((tag) => {
        if (tag) {
          message.channel.send(tag.content);
        } else client.error(message.channel, st.notFound.title, st.notFound.desc);
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
