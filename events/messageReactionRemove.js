module.exports = async (client, messageReaction, user) => {
  if (user.bot || messageReaction.message.guild.id !== client.config.mainGuild) {
    return;
  }

  let reactionRoleMenu = await client.reactionRoles.selectAll(messageReaction.message.id);

  // If not there isn't a type, then this is not a reaction role message.
  if (!reactionRoleMenu || !reactionRoleMenu.rows || reactionRoleMenu.rows.length < 1) {
    return;
  }

  reactionRoleMenu = reactionRoleMenu.rows[0];


  reactionRoleMenu.reactions = JSON.parse(reactionRoleMenu.reactions);
  const roleID = reactionRoleMenu.reactions[messageReaction.emoji.id || messageReaction.emoji.identifier];

  if (roleID) {
    const member = await client.guilds.cache.get(client.config.mainGuild).members.fetch(user.id);
    if (member && member.roles.cache.has(roleID)) {
      member.roles.remove(roleID, '[Auto] Reaction Role Remove');
    }
  }
};
