module.exports = async (client, messageReaction, user) => {
  if (user.bot || messageReaction.message.guild.id !== client.config.mainGuild) {
    return;
  }

  let reactionRoleMenu = client.db.reactionRoles.getProp(messageReaction.message.id, 'reactions');

  // If not there isn't a type, then this is not a reaction role message.
  if (!reactionRoleMenu) {
    return;
  }
  reactionRoleMenu.reactions = JSON.parse(reactionRoleMenu);
  const roleID = reactionRoleMenu.reactions[messageReaction.emoji.id || messageReaction.emoji.identifier];

  if (roleID) {
    const member = await client.guilds.cache.get(client.config.mainGuild).members.fetch(user.id);
    if (member && member.roles.cache.has(roleID)) {
      member.roles.remove(roleID, '[Auto] Reaction Role Remove');
    }
  }
};
