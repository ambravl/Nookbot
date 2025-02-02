module.exports.run = async (client, message, args) => {
  const strings = client.mStrings.addPermission;
  if (!args || args.length < 2) return client.error(message.channel, strings.none.title, strings.none.desc);
  const arguments = args.join(' ').split('-');
  const roleName = arguments[0].trim();
  const permissionName = arguments[1].trim();
  let role;
  if (isNaN(roleName)) {
    if (message.mentions && message.mentions.roles) role = message.mentions.roles.first();
    role = message.guild.roles.cache.find(r => r.name.toLowerCase().startsWith(roleName.toLowerCase()));
  } else role = message.guild.roles.cache.get(roleName);
  if (!role) return client.error(message.channel, strings.invalid.title, strings.invalid.desc);
  const permission = fetchPermission(permissionName);
  if (!permission) return newPermission(strings, role, message.channel);
  client.permissionDB.safeUpdate(role.id, permission, ['name', 'level'], false)
    .then(() => {
      client.success(message.channel, strings.updated.title, `**${role.name}** ${strings.updated.desc} ${permission[0]}`);
      client.levelCache[permission[1]] = {
        roleID: role.id,
        name: permission[0],
        level: permission[1]
      }
    })
    .catch((err) => client.handle(err, 'updating permissions', message));
};

function newPermission(strings, role, channel, client) {
  const filter = response => {
    return (response.content.toLowerCase() === 'cancel' || (response.content.length < 3 && !isNaN(response)));
  };
  channel.send(`**${strings.newPermission.title}**\n${strings.newPermission.desc}`)
    .then(() => {
      channel.awaitMessages(filter, {max: 1})
        .then(collected => {
          if (collected.first().content.toLowerCase() === 'cancel') return client.error(channel, strings.cancel.title, strings.cancel.desc);
          const newLevel = parseInt(collected.first().content);
          client.permissionDB.insert(role.id, [newLevel, role.name], ['name', 'level'])
            .then(() => channel.send(`**${strings.newSuccess.title}**\n${role.name} ${strings.newSuccess.desc} ${newLevel}`))
            .catch((err) => client.handle(err, 'inserting new permission'));
        })
        .catch((err) => client.handle(err, 'awaiting messages'));
    })
    .catch((err) => client.handle(err, 'sending message asking for a new permission'));
}

function fetchPermission(permissionName) {
  if (!permissionName || permissionName.toLowerCase() === 'cancel') return null;
  const permissionLevels = ['User',
    'Verified',
    'Redd',
    'Head Redd',
    'Mod',
    'Head Mod',
    'Admin',
    'Server Owner',
    'Bot Support',
    'Bot Admin',
    'Bot Owner'];
  let permission;
  if (isNaN(permissionName)) permission = permissionLevels.find((permLevel) =>
    permLevel.toLowerCase() === permissionName.toLowerCase()
  );
  else if (permissionName.length < 3) permission = permissionLevels[parseInt(permissionName)];
  return [permission, permissionLevels.indexOf(permission)];
}


module.exports.conf = {
  guildOnly: true,
  aliases: ['adperm', 'adp', 'addperm', 'addlvl', 'addlevel'],
  permLevel: 'Mod',
};

module.exports.help = {
  name: 'addpermission',
  category: 'moderation',
  description: 'Adds a new role to the permission database so it can run appropriate commands',
  usage: 'addpermission <role> - <level>',
};