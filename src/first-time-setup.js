module.exports.run = (client) => {
  client.db.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;`)
    .then(() => {
      Object.keys(client.dbSchema).forEach((table) => {
        let columns = [];
        Object.keys(client.dbSchema[table]).forEach((key) => {
          columns.push(`${key} ${client.dbSchema[this.name][key]}`)
        });
        client.db.query(`CREATE TABLE ${table} (${columns.join(', ')})`)
          .then(() => {
            let insertQuery = [];
            switch (table) {
              case 'enabledCommands':
                client.commands.indexes.forEach((command) => {
                  insertQuery.push(`('${command}', true)`);
                });
                break;
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
                  .forEach((v, i) => insertQuery.push(`(${i}, ${i}, ${v})`));
                break;
              case 'configDB':
                insertQuery = [
                  "('banAppealLink', 'https://github.com/ambravl/leifbot/blob/testdidntwork/src/dbUser.js', 'text', '')",
                  "(sesCategory', '', 'text', '718592304834805841')",
                  "(prefix', '.', 'text', '')",
                  "(playlist', 'PLmJ4dQSfFie-81me0jlzewxPIxKuO2-sI', 'text', '')",
                  "(music', '718645777399808001', 'text', '718627110159122452')",
                  "(musicText', '720055418923122788', 'text', '718592382194417754')",
                  "(staffChat', '718581551331409971', 'text', '')",
                  "(modLog', '720058757954011231', 'text', '')",
                  "(reportMail', '720058757954011231', 'text', '')",
                  "(modMailGuild', '', 'text', '')",
                  "(mainGuild', '717575621420646432', 'text', '')",
                  "(raidJoinCount', '10', 'int', '1')",
                  "(raidJoinsPerSecond', '10', 'int', '1')",
                  "(joinLeaveLog', '717575621961580609', 'text', '720057918791090212')",
                  "(actionLog', '720057918791090212', 'text', '')",
                  "(mutedRole', '', 'text', '')",
                  "(imageOnlyChannels', '', 'text', '')",
                  "(newlineLimitChannels', '', 'text', '')",
                  "(newlineLimit', '', 'text', '')",
                  "(imageLinkLimit', '', 'text', '')",
                  "(noMentionsChannels', '', 'text', '')",
                  "(ignoreChannel', '', 'array', '')",
                  "(ignoreMember', '', 'array', '')",
                  "(announcementsChannel', '', 'text', '')",
                  "(positiveRepLimit', '100', 'text', '100')",
                  "(negativeRepLimit', '5', 'text', '5')"
                ];
                break;
            }
            if (insertQuery) client.db.query(`INSERT INTO ${table} VALUES ${insertQuery.join(', ')}`);
          })
          .catch((err) => {
            client.handle(err, 'creating first-time tables')
          });
      })
    })
    .catch((err) => {
      client.handle(err, 'dropping schema')
    })
};