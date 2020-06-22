module.exports.run = async (client, message, args) => {
  const caseNum = parseInt(args[0], 10);

  if (caseNum < 0) {
    return client.error(message.channel, 'Invalid Number!', 'Please provide a valid case number to apply medicine to!');
  }
  client.infractions.delete(args[0])
    .then(async (res) => {
      if (res && res.rows && res.rows.length > 0) {
        console.log(res.rows[0]);
        client.userDB.pop(res.rows[0].userid, caseNum, 'infractions', 'case')
          .then((result) => {
            const infRemoved = result.rows[0].to_remove;

            client.users.fetch(res.rows[0].userid)
              .then((user) => {
                client.success(message.channel, 'Medicine Applied!', `**${user.tag}** was given medicine to cure **${infRemoved.points}** bee sting${infRemoved.points === 1 ? '' : 's'} from case number **${caseNum}**!`);
              })
              .catch((err) => {
                client.handle(err, 'fetching healed user')
              })

          })
          .catch((err) => {
            client.handle(err, 'popping medicine', message)
          });
      } else client.error(message.channel, 'Invalid Case Number!', 'Please provide a valid case number to apply medicine to!');
    })
    .catch((err) => {
      client.handle(err, 'medicine', message);
      client.error(message.channel, 'Invalid Case Number!', 'Please provide a valid case number to apply medicine to!');
    });
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['beestingdel', 'beedel', 'bsdel', 'stingdel', 'med', 'cure', 'beeremove'],
  permLevel: 'Head Redd',
  args: 1,
};

module.exports.help = {
  name: 'medicine',
  category: 'moderation',
  description: 'Remove bee stings on server members.',
  usage: 'Medicine <case number>',
  details: '<case number> => The case number for the sting to be removed.',
};
