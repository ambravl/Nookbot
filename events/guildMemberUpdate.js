const Discord = require('discord.js');

module.exports = async (client, oldMember, newMember) => {
  if (newMember.guild.id !== client.config.mainGuild) {
    return;
  }

  if (oldMember.nickname !== newMember.nickname) {
    const escapeChars = /([*~_`<|])/g;
    const treat = function (text, altText) {
      if(text) return text.replace(escapeChars, '//$1');
      else return altText.replace(escapeChars, '//$1')
    };
    const embed = new Discord.MessageEmbed()
      .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
      .setTimestamp()
      .setColor('#00e5ff')
      .setFooter(`ID: ${newMember.id}`)
      .addField('**Nickname Update**', `**Before:**${treat(oldMember.nickname, oldMember.user.username)}
**+After:**${treat(newMember.nickname, newMember.user.username)}`);

    client.userDB.safeUpdate(newMember.id, { timestamp: Date.now(), nickname: newMember.nickname || newMember.user.username }, 'nicknames')
      .catch((err) => {
        client.handle(err, 'guildMemberUpdate', Discord)
      });

    oldMember.guild.channels.cache.get(client.config.actionLog).send(embed);
  }
};
