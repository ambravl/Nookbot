module.exports = async (client, messageReaction, user) => {
  const reactionRoleMenu = await client.handleReaction(client, messageReaction, user);
  const member = await client.guilds.cache.get(client.config.mainGuild).members.fetch(user.id);
  if (!member || !reactionRoleMenu || !reactionRoleMenu.roleID) return;
  switch (reactionRoleMenu.type) {
    case 'remove':
      if (member && member.roles.cache.has(roleID)) {
        member.roles.remove(reactionRoleMenu.roleID, '[Auto] Remove Reaction Role')
          .catch((err) => {
            client.handle(err, 'removing roles on reaction add?', messageReaction.message)
          });
      }
      break;
    case 'exclusive':
      const rolesToRemove = [];
      member.roles.cache.forEach((role, rID) => {
        if (rID !== roleID && reactionRoleMenu.roles.includes(rID)) {
          rolesToRemove.push(rID);
        }
      });
      if (rolesToRemove.length !== 0) {
        await member.roles.remove(rolesToRemove, '[Auto] Exclusive Reaction Role Remove');
      }
      if (!member.roles.cache.has(roleID)) {
        member.roles.add(roleID, '[Auto] Exclusive Reaction Role Add')
          .catch((err) => {
            client.handle(err, 'adding exclusive reaction role', messageReaction.message)
          });
      }
      break;
    case 'multiple':
      // Members can have any number of the roles in this menu.
      if (!member.roles.cache.has(roleID)) {
        member.roles.add(roleID, '[Auto] Multiple Reaction Role Add')
          .catch((err) => {
            client.handle(err, 'adding multiple-type reaction role', messageReaction.message)
          });
      }
      }

  // If message has a cumulative count of reactions over 4000, reset all the reactions on the message.
  let totalReactions = 0;
  messageReaction.message.reactions.cache.forEach((reaction) => { totalReactions += reaction.count; });
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
            client.handle(err, 'removing all reactions from >4000 message', messageReaction.message)
          });
      })
      .catch((err) => {
        // Failed to remove all reactions.
        console.error(err);
      });
  }
};
