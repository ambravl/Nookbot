module.exports = (client) => {
  client.configDB.query(`SELECT * FROM configDB`, (err, res) => {
    if(err) {
      console.error(`Encountered error when reading the configuration database, error: ${err}`);
      throw err;
    }
    let config = res.rows;
    const testing = true;
    const valueCol = testing ? "testing_value" : "config_value";
    config.forEach(row => {
      switch(row.config_type){
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
  client.permLevels = client.permissionDB.query(`SELECT * FROM permissionDB`).rows;
  client.levelCheck = (level, client, message) => {
    if(level.level === 0) return true;
    if(level.name === 'Server Owner' && !!(message.guild && message.author.id === message.guild.ownerID)) return true;
    if(message.guild){
      const levelObj = message.guild.roles.cache.get(level.roleID);
      if(levelObj && message.member.roles.cache.has(levelObj.id)) return true;
      if(level.name === 'Admin' && message.member.hasPermission('ADMINISTRATOR')) return true;
    }
    return false;
  }
};