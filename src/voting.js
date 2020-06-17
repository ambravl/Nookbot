module.exports.vote = (client, message, args, positive) => {
  let strings = positive ? client.mStrings['upvote'] : client.mStrings['downvote'];
  let list = positive ? 'posRepList' : 'negRepList';
  let rep = positive ? 'positiveRep' : 'negativeRep';
  let limit = positive ? client.config.positiveRepLimit : client.config.negativeRepLimit;
  // Attempt to find a member using the arguments provided
  const member = (message.mentions.members.first() ||
    message.guild.members.cache.get(args[0]) ||
    client.searchMember(args.join(' ')));

  if (!member) {
    return client.error(
      message.channel,
      strings.invalidMember.title,
      strings.invalidMember.desc
    );
  }

  if (member.id === message.author.id) {
    return client.error(
      message.channel,
      strings.voteSelf.title,
      strings.voteSelf.desc
    );
  }

  client.userDB.ensure(member.id, '', '*')
    .then((result) => {
      const voted = result.rows[0];
      if (voted[list].includes(message.author.id)) {
        return client.error(
          message.channel,
          strings.alreadyVoted.title,
          strings.alreadyVoted.descL + member.displayName + strings.alreadyVoted.descR
        );
      }
      if (voted.posRepList.includes(message.author.id)) {
        client.userDB.switchPoints(true, member.id, message.author.id);
        client.success(
          message.channel,
          strings.changed.title,
          `${strings.changed.description}${member.displayName}**!`
        );
      } else {
        client.userDB.mathAndPush(member.id, [-1, message.author.id], [rep, list]);
        client.success(message.channel, strings.success.title, `${strings.success.desc} **${member.displayName}**!`);
      }
      if (voted[list].length + 1 === limit) {
        message.guild.channels.cache.get(client.config.staffChat).send(
          `${rep} Threshold Reached!\n
          **${member.user.tag}** (${member}) has reached **${limit}** ${rep}orts!`
        );
      }
    })
    .catch((err) => {
      client.handle(err, 'voting', message)
    });
};