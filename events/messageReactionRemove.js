module.exports = async (client, messageReaction, user) => {
  const reactionRoleMenu = await client.handleReaction(client, messageReaction, user);
  const member = await client.guilds.cache.get(client.config.mainGuild).members.fetch(user.id);
  if (!member || !reactionRoleMenu || !reactionRoleMenu.roleid) return;
  if (member.roles.cache.has(reactionRoleMenu.roleid)) {
    member.roles.remove(reactionRoleMenu.roleid, '[Auto] Reaction Role Remove')
      .catch((err) => {
        client.handle(err, 'remove role based on reaction', messageReaction.message)
      });
  }
};
