module.exports = async (client, messageReaction, user) => {
  const reactionRoleMenu = await client.handleReaction(client, messageReaction, user);
  const member = await client.guilds.cache.get(client.config.mainGuild).members.fetch(user.id);
  console.log('awaited');
  console.log(member);
  console.log(reactionRoleMenu);
  if (!member || !reactionRoleMenu || !reactionRoleMenu.roleid) return;
  console.log('passed checks');
  if (reactionRoleMenu.type === 'exclusive') {
    console.log('got in the right type');
    const rolesToRemove = [];
    member.roles.cache.forEach((role, rID) => {
      if (rID !== reactionRoleMenu.roleid && reactionRoleMenu.roles.includes(rID)) {
        rolesToRemove.push(rID);
      }
    });
    if (rolesToRemove.length > 0) {
      member.roles.remove(rolesToRemove, '[Auto] Exclusive Reaction Role Remove')
        .catch((err) => {
          client.handle(err, 'removing exclusive reactions')
        })
    }
  }
  // Members can have any number of the roles in this menu.
  if (!member.roles.cache.has(reactionRoleMenu.roleid)) {
    console.log('tried adding a role');
    member.roles.add(reactionRoleMenu.roleid, '[Auto] Reaction Role Add')
      .catch((err) => {
        client.handle(err, 'adding reaction role')
      });
  }

  // If message has a cumulative count of reactions over 4000, reset all the reactions on the message.
  let totalReactions = 0;
  messageReaction.message.reactions.cache.forEach((reaction) => {
    totalReactions += reaction.count;
  });
    if (totalReactions > 4000) {
      // Remove all reactions.
      messageReaction.message.reactions.removeAll()
        .then((message) => {
          console.log(`Removed ${totalReactions} reactions from message ${message.id}(msgID) in ${message.channel.id}(chID) and reset them.`);
          // Add back one of each reaction.
        client.asyncForEach(reactionRoleMenu.emoji, async (emoji) => {
          await message.react(emoji);
        })
          .catch((err) => {
            client.handle(err, 'removing all reactions from >4000 message')
          });
      })
      .catch((err) => {
        // Failed to remove all reactions.
        console.error(err);
      });
  }
};
