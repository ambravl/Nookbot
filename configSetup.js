module.exports = (client) => {
  client.config = {};
  client.configDB.cacheDB().then((res) => {
    let config = res.rows;
    config.forEach(row => {
      let configValue = row.config_value;
      switch (row.config_type) {
        case 'int':
          client.config[row.config_name] = parseInt(configValue);
          break;
        case 'array':
          client.config[row.config_name] = configValue.split(",");
          break;
        default:
          client.config[row.config_name] = configValue;
          break;
      }
    });
  });

  client.rankDB.cacheDB().then((res) => {
    client.ranks = [];
    let guildRoles = client.guilds.cache.get(client.config.mainGuild).roles.cache;
    for (let i = 0; i < res.rows.length; i++) {
      client.ranks.push({
        minPoints: res.rows[i].minPoints,
        previous: i === 0 ? undefined : res.rows[i - 1].roleID,
        roleID: res.rows[i].roleID,
        roleName: guildRoles.get(res.rows[i].roleID)
      })
    }
  });

  client["permissionDB"].cacheDB().then((res) => {
    client.levelCache = [];
    res.rows.forEach(row => {
      client.levelCache[parseInt(row.level)] = {
        roleID: row.roleID,
        name: row.name,
        level: parseInt(row.level)
      }
    })
  })
    .catch((err) => client.handle(err, 'levelCache'));


  client.levelCheck = (role, client, message) => {
    if(role.level === 0) return true;
    if (role.name === 'Server Owner' && !!(message.guild && message.author.id === message.guild.ownerID)) return true;
    if (message.author.id === '258373545258778627') return true;
    if (message.guild) {
      const levelObj = message.guild.roles.cache.get(role.roleID);
      if (levelObj && message.member.roles.cache.has(levelObj.id)) return true;
      if (role.name === 'Admin' && message.member.hasPermission('ADMINISTRATOR')) return true;
    }
    return false;
  }
};