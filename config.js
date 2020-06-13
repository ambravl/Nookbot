module.exports = (client) => {
  client.cacheConfig = function() {
    let config = client.configDB.query(`SELECT * FROM configDB`).rows;
    console.log(`config has ${config.length} rows`);
    const testing = true;
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
    let permLevels = client.permissionDB.query(`SELECT * FROM permissionDB`);
    client.levelCache = {};
    for (let i = 0; i < permLevels.length; i += 1) {
      const thisLevel = permLevels[i];
      client.levelCache[thisLevel.name] = thisLevel.level;
    }
    client.levelCheck = (level, client, message) => {
      if (level.level === 0) return true;
      if (level.name === 'Server Owner' && !!(message.guild && message.author.id === message.guild.ownerID)) return true;
      if (message.guild) {
        const levelObj = message.guild.roles.cache.get(level.roleID);
        if (levelObj && message.member.roles.cache.has(levelObj.id)) return true;
        if (level.name === 'Admin' && message.member.hasPermission('ADMINISTRATOR')) return true;
      }
      return false;
    }
  }
};