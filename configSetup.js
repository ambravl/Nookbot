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
          client.config[row.config_name] = configValue ? configValue.split(",") : [];
          break;
        default:
          client.config[row.config_name] = configValue;
          break;
      }
    });
  });

  client.rankDB.cacheDB().then((res) => {
    client.ranks = [];
    for (let i = 0; i < res.rows.length; i++) {
      client.ranks.push({
        minPoints: res.rows[i].minPoints,
        previous: i === 0 ? undefined : res.rows[i - 1].roleid,
        roleID: res.rows[i].roleid
      })
    }
  });

  client.permissionDB.cacheDB().then((res) => {
    client.levelCache = [];
    res.rows.forEach(row => {
      client.levelCache.push({
        roleID: row.roleid,
        name: row.name,
        level: parseInt(row.level)
      })
    })
  })
    .catch((err) => client.handle(err, 'levelCache'));

  client.getHighestRole = (client, message, member) => {
    if (message.guild && member.id === message.guild.owner.id)
      return client.levelCache.find((level) => level.name === 'Server Owner');
    if (message.author.id === client.config.botOwner)
      return client.levelCache.find((level) => level.name === 'Bot Owner');
    const highest = member ? member.roles.highest.id : client.guilds.cache.get(client.config.mainGuild).members.cache.get(message.author.id).roles.highest.id;
    console.log(highest);
    const highestLevel = client.levelCache.find((level) => level.roleID === highest);
    return highestLevel ? highestLevel : client.levelCache.find((level) => level.level === 0);
  }
};