module.exports.run = async (client) => {
  let query = ['DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public'];
  Object.keys(client.dbSchema).forEach((table) => {
    let columns = [];
    Object.keys(client.dbSchema[table]).forEach((key) => {
      columns.push(`${key} ${client.dbSchema[table][key]}`)
    });
    query.push(`CREATE TABLE ${table} (${columns.join(', ')})`);
    let insertQuery;
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
          "(sesCategory', '', 'text', '698388740040556586')",
          "(prefix', '.', 'text', '')",
          "(playlist', 'PLmJ4dQSfFie-81me0jlzewxPIxKuO2-sI', 'text', '')",
          "(music', '718645777399808001', 'text', '721429219187359794')",
          "(musicText', '720055418923122788', 'text', '720568062490705931')",
          "(staffChat', '718581551331409971', 'text', '720568062490705931')",
          "(modLog', '720058757954011231', 'text', '720568062490705931')",
          "(reportMail', '720058757954011231', 'text', '720568062490705931')",
          "(modMailGuild', '', 'text', '')",
          "(mainGuild', '717575621420646432', 'text', '435195075375661067')",
          "(raidJoinCount', '10', 'int', '1')",
          "(raidJoinsPerSecond', '10', 'int', '1')",
          "(joinLeaveLog', '717575621961580609', 'text', '720057918791090212')",
          "(actionLog', '720057918791090212', 'text', '720568062490705931')",
          "(mutedRole', '', 'text', '')",
          "(imageOnlyChannels', '', 'array', '718192476828991550')",
          "(newlineLimitChannels', '', 'array', '718192476828991550')",
          "(newlineLimit', '10', 'int', '')",
          "(imageLinkLimit', '3', 'int', '')",
          "(noMentionsChannels', '', 'array', '718192476828991550')",
          "(ignoreChannel', '', 'array', '698388868235526164')",
          "(ignoreMember', '', 'array', '')",
          "(announcementsChannel', '', 'text', '716935607934386257')",
          "(positiveRepLimit', '100', 'int', '')",
          "(negativeRepLimit', '5', 'int', '')"
        ];
        break;
    }
    if (insertQuery) query.push(`INSERT INTO ${table} VALUES (${insertQuery.join(', ')})`);
  });
  return query.join('; ')
};