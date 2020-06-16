module.exports = (client) => {
  client.config = {};
  client.configDB.cacheDB().then((res) => {
    const testing = true;
    let config = res.rows;
    console.log(`config has ${config.length} rows`);
    const valueCol = testing ? "testing_value" : "config_value";
    config.forEach(row => {
      switch (row.config_type) {
        case 'int':
          client.config[row.config_name] = parseInt(row[valueCol]);
          break;
        case 'array':
          client.config[row.config_name] = row[valueCol].split(",");
          break;
        default:
          client.config[row.config_name] = row[valueCol];
          break;
      }
    });
  });

  client["permissionDB"].cacheDB().then((res) => {
    client.levelCache = [];
    res.rows.forEach(row => {
      client.levelCache[parseInt(row.level)] = {
        level: parseInt(row.level),
        roleID: row.roleID,
        name: row.name
      }
    })
  })
    .catch((err) => client.handle(err, 'levelCache'));


  client.levelCheck = (role, client, message) => {
    console.log(`role level: ${role.level}`);
    if(role.level === 0) return true;
    if(role.name === 'Server Owner' && !!(message.guild && message.author.id === message.guild.ownerID)) return true;
    if(message.guild){
      const levelObj = message.guild.roles.cache.get(role.roleID);
      if(levelObj && message.member.roles.cache.has(levelObj.id)) return true;
      if(role.name === 'Admin' && message.member.hasPermission('ADMINISTRATOR')) return true;
    }
    return false;
  }
};