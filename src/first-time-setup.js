module.exports.run = async (client) => {
  let query = [];
  Object.keys(client.dbSchema).forEach((table) => {
    let columns = [];
    Object.keys(client.dbSchema[table]).forEach((key) => {
      columns.push(`${key} ${client.dbSchema[table][key]}`)
    });
    query.push(`DROP TABLE ${table};CREATE TABLE ${table} (${columns.join(', ')})`);
    let insertQuery = [];
    switch (table) {
      case 'permissionDB':
        ['User',
          'Verified',
          'Redd',
          'Head Redd',
          'Mod',
          'Head Mod',
          'Admin',
          'Server Owner',
          'Bot Support',
          'Bot Admin',
          'Bot Owner']
          .forEach((v, i) => insertQuery.push(`('${i}', ${i}, '${v}')`));
        break;
      case 'rankDB':
        insertQuery = [
          "('723560784357228605', 2)",
          "('723560752576725143', 1)",
          "('723560809653076039', 3)"
        ];
        break;
      case 'configDB':
        insertQuery = [
          "('banAppealLink', 'https://github.com/ambravl/leifbot/blob/testdidntwork/src/dbUser.js', 'text')",
          "('sesCategory', '', 'text')",
          "('prefix', '.', 'text')",
          "('playlist', 'PLmJ4dQSfFie-81me0jlzewxPIxKuO2-sI', 'text')",
          "('music', '718645777399808001', 'text')",
          "('musicText', '720055418923122788', 'text')",
          "('staffChat', '718581551331409971', 'text')",
          "('modLog', '720058757954011231', 'text')",
          "('reportMail', '720058757954011231', 'text')",
          "('mainGuild', '717575621420646432', 'text')",
          "('raidJoinCount', '10', 'int')",
          "('raidJoinsPerSecond', '10', 'int')",
          "('joinLeaveLog', '717575621961580609', 'text')",
          "('actionLog', '720057918791090212', 'text')",
          "('mutedRole', '', 'text')",
          "('imageOnlyChannels', '', 'array')",
          "('newlineLimitChannels', '', 'array')",
          "('newlineLimit', '10', 'int')",
          "('imageLinkLimit', '3', 'int')",
          "('noMentionChannels', '', 'array')",
          "('ignoreChannel', '', 'array')",
          "('ignoreMember', '', 'array')",
          "('announcementsChannel', '', 'text')",
          "('positiveRepLimit', '100', 'int')",
          "('negativeRepLimit', '5', 'int')",
          "('botCommands', '718592382194417754', 'text')",
          "('giveawayChannel', '717599016665350164', 'text')",
          "('rankedChannels', '718581551331409971', 'array')"
        ];
        break;
      case 'adoptees':
        const fs = require('fs');

        try {
          const data = fs.readFileSync('src/villagers.txt', 'utf8');
          const fixedData = data.split('\n');

          fixedData.forEach((vil) => {
            insertQuery.push(`('${vil.trim()}', '{}')`);
          });
        } catch (e) {
          console.error(e);
        }
        break;
    }
    if (insertQuery && insertQuery.length > 0) query.push(`INSERT INTO ${table} VALUES ${insertQuery.join(', ')}`);
  });
  return query.join('; ')
};