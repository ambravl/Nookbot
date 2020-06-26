module.exports.sting = async function sting(oldStings, newStings, reason, member) {
  const punishments = [
    {
      stings: 0,
      action: 'warn'
    },
    {
      stings: 10,
      action: 'mute',
      length: 12
    },
    {
      stings: 20,
      action: 'mute',
      length: 24
    },
    {
      stings: 30,
      action: 'mute',
      length: 72
    },
    {
      stings: 40,
      action: 'ban'
    },
    {
      action: "default"
    }
  ];
  let punishment;
  for (let i = 0; i < punishments.length - 1; i++) {
    if (oldStings < punishments[i].stings && newStings + oldStings >= punishments[i].stings) punishment = punishments[i];
  }
  if (!punishment) punishment = newStings === 0 ? punishments[0] : punishments[punishments.length - 1];

  const Discord = require('discord.js');
  const strings = require('./strings.json');
  const embed = new Discord.MessageEmbed()
    .setTitle(strings.beesting[punishment.action] + (punishment.action.length || '') + strings.beesting.reason)
    .setDescription(reason)
    .addField('New Stings', newStings, true)
    .addField('Total Stings', oldStings + newStings, true)
    .setFooter(strings.beesting.appeal)
    .setColor(punishment.action === 'ban' ? 'RED' : punishment.action === 'mute' ? 'ORANGE' : 'YELLOW');

  try {
    const dmChannel = await member.createDM();
    await dmChannel.send(embed);
  } catch (e) {
    throw e;
  }
  return punishment.action;

}