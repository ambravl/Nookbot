/**
 * @param {{adoptees:Object}} client
 */

module.exports.run = (client, message, args) => {
  switch (args[0] && args[0].toLowerCase()) {
    case 'list':
    case 'l':
    case 'show':
      const msg = [];
      client.adoptees.selectSearchArray(message.author.id, 'adopters').then((res) => {
        if (res && res.rows) {
          res.rows.forEach((row) => {
            msg.push(row.name);
          })
        }
      });

      if (msg.length > 0) {
        return message.channel.send(`${client.mStrings.adopt.onList}${msg.join(', ')}.`, {split: true});
      }
      return client.error(
        message.channel,
        client.mStrings.adopt.notSigned.title,
        client.mStrings.adopt.notSigned.description + '<villager name>` command.'
      );
    case 'delete':
    case 'd':
    case 'cancel':
    case 'remove':
      if (args.length === 1) {
        // No villager name was given
        return client.error(
          message.channel,
          client.mStrings.adopt.noNameGiven.title,
          client.mStrings.adopt.noNameGiven.removal
        );
      }
      client.adoptees.levenshtein(args.slice(1).join(' ').toProperCase())
        .then(
          /**
           * @param {HTMLTableRowElement|string|null} villager
           * @param {{adopters:Array}} villager
           * @param {{name:string}} villager
           * @returns {void|*}
           */
          (villager) => {
            // Remove user ID of author from the list of adopters for the given villager if they are on the list already
            if (!villager) return client.error(
              message.channel,
              client.mStrings.adopt.wrongName.title,
              client.mStrings.adopt.wrongName.description
            );
            if (villager.adopters.includes(message.author.id)) {
              client.adoptees.pop(villager.name, message.author.id, 'adopters');
              return client.success(
                message.channel,
                client.mStrings.adopt.removed.title,
                `${client.mStrings.adopt.removed.description} **${villager.name}**!`
              );
            }
            return client.error(
              message.channel,
              client.mStrings.adopt.notOnList.title,
              `${client.mStrings.adopt.notOnList.description} **${villager.name}**!`
            );
          });
      break;
    case 'check':
    case 'peek':
      if (args.length === 1) {
        // No villager name was given
        return client.error(message.channel,
          client.mStrings.adopt.noNameGiven.title, client.mStrings.adopt.noNameGiven.check);
      }
      client.adoptees.levenshtein(args.slice(1).join(' ').toProperCase())
        .then(
          /**
           * @param {HTMLTableRowElement|string|null} villager
           * @param {{adopters:Array}} villager
           * @param {{name:string}} villager
           * @returns {void|*}
           */
          (villager) => {
            if (!villager) return client.error(
              message.channel,
              client.mStrings.adopt.wrongName.title,
              client.mStrings.adopt.wrongName.description
            );
            const vilAdoptersLength = villager.adopters.length;
            if (vilAdoptersLength > 0)
              return message.channel.send(
                `There are **${vilAdoptersLength}** members who wish to adopt **${villager.name}**!`
              );
            return message.channel.send(`${client.mStrings.adopt.noAdopters} **${villager.name}**!`)
          })
        .catch((err) => {
          client.handle(err, 'ad check', message)
        });
      break;
    default:
      if (args.length === 0) {
        // No villager name was given
        return client.error(
          message.channel,
          client.mStrings.adopt.noNameGiven.title,
          client.mStrings.adopt.noNameGiven.adoption
        );
      }
      client.adoptees.levenshtein(args.join(' ').toProperCase())
        .then(
          /**
           * @param {HTMLTableRowElement|string|null} villager
           * @param {{adopters:Array}} villager
           * @param {{name:string}} villager
           * @returns {void|*}
           */
          (villager) => {
            if (!villager) return client.error(
              message.channel,
              client.mStrings.adopt.wrongName.title,
              client.mStrings.adopt.wrongName.description
            );
            if (!villager.adopters.includes(message.author.id)) {
              // Add them to the list
              client.adoptees.push(villager.name, message.author.id, 'adopters');
              return client.success(
                message.channel,
                client.mStrings.adopt.added.title,
                `${client.mStrings.adopt.added.descL}${villager.name}${client.mStrings.adopt.added.descR}`
              );
            }
            return client.error(
              message.channel,
              client.mStrings.adopt.alreadyOnList.title,
              `${client.mStrings.adopt.alreadyOnList.description}${villager.name}**!`
            );
          })
        .catch((err) => {
          client.handle(err, 'adoption add', message)
        })
  }
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['ad'],
  permLevel: 'User',
  allowedChannels: ['549858839994826753'],
};

module.exports.help = {
  name: 'adopt',
  category: 'game',
  description: 'Allows members to be notified when a user puts a specific villager up for adoption',
  usage: 'adopt <delete|list> <villager name>',
  details: '<villager name> => Sign up to be pinged when the villager you specifiy is placed up for adoption.\n<delete> => Remove yourself from the list of members to be pinged when the villager you specifiy is placed up for adoption.\n<list> => Lists all of the villagers that you have signed up to adopt.',
};
