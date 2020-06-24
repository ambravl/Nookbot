/* eslint-disable max-len */
/* eslint-disable consistent-return */
const Discord = require('discord.js');

const cooldowns = new Discord.Collection();

module.exports = async (client, message) => {
  // Ignore all bots
  if (message.author.bot) return;

  if (message.guild) {

    if (!message.member) {
      await message.guild.members.fetch(message.author);
    }

    if (message.channel.id === client.config.modMail || message.channel.id === client.config.reportMail) {
      const messageID = message.content.match(/https?:\/\/discord.+com\/channels\/\d+\/\d+\/(\d+)/);
      if (client.modMail[messageID[0]] || client.suggestions.includes(messageID[0])) {
        client.modMailDB.select(messageID[0], 'memberid')
          .then(async (res) => {
            if (!res) return client.error(message.channel, 'Not found!', "Couldn't find the modmail's author!");
            const dmChannel = await client.users.cache.get(res).createDM();
            const dmEmbed = new Discord.MessageEmbed().setTitle('New reply to your modmail!');
            dmEmbed.setDescription(message.content.replace(/https?:\/\/.+discord.+com\/\d+\/\d+\/\d+\/? ?/, ''))
            dmChannel.send(dmEmbed);
            return client.success(message.channel, 'Sent!', 'Your reply was sent to the modmail author!')
          })
      }
    }

    // Anti Mention Spam
    if (message.mentions.members && message.mentions.members.size > 10) {
      // They mentioned more than 10 members, automute them for 10 mintues.
      if (message.member && client.getHighestRole(client, message, message.member).level < 4) {
        // Mute
        message.member.roles.add(client.config.mutedRole, 'Mention Spam');
        // Delete Message
        if (!message.deleted) {
          message.delete();
        }
        // Schedule unmute
        setTimeout(() => {
          try {
            message.member.roles.remove(client.config.mutedRole, 'Unmuted after 10 mintues for Mention Spam');
          } catch (error) {
            // Couldn't unmute, oh well
            console.error('Failed to unmute after Anti Mention Spam');
            console.error(error);
          }
        }, 600000);
        // Notify mods so they may ban if it was a raider.
        message.guild.channels.cache.get(client.config.staffChat).send(`**Mass Mention Attempt!**
<@&${client.levelCache[4]}> <@&${client.levelCache[5]}> <@&${client.levelCache[6]}>
The member **${message.author.tag}** just mentioned ${message.mentions.members.size} members and was automatically muted for 10 minutes!
They have been a member of the server for ${client.humanTimeBetween(Date.now(), message.member.joinedTimestamp)}.
If you believe this member is a mention spammer bot, please ban them with the command:
\`.ban ${message.author.id} Raid Mention Spammer\``);
      }
    }

    if (client.checkers.some((checker) => {
      checker.run(message)
    })) return;


    client.userDB.ensure(message.author.id, 0, 'points')
      .then((res) => {
        if (client.config.rankedChannels.includes(message.channel.id)) {
          client.userDB.math(message.author.id, '+', 1, 'points');
          const role = client.ranks.find(rank => rank.minPoints === res + 1);
          if (role) {
            message.member.roles.add(role.roleid, '[Auto] Rank Up');
            if (role.previous) message.member.roles.remove(role.previous, '[Auto] Rank Up');
            const name = message.guild.roles.cache.get(roleID).name;
            client.userDB.update(message.author.id, name, 'rankRole');
            const embed = new Discord.MessageEmbed()
              .setTitle(`${client.mStrings.rank.up.title} <@#{message.author.id}>!`)
              .setDescription(client.mStrings.rank.up.descL + name + client.mStrings.rank.up.descR);
            message.channel.send(embed);
          }
        }
      })
      .catch((err) => {
        client.handle(err, 'ensuring a member exists when adding points')
      });

    // Emoji finding and tracking
    const regex = /<a?:\w+:([\d]+)>/g;
    const msg = message.content;
    let regMatch;
    while ((regMatch = regex.exec(msg)) !== null) {
      console.log('found emoji');
      const emojiMatch = regMatch[1];
      console.log(emojiMatch);
      // If the emoji ID is in our emoji, then increment its count
      client.emojiDB.select(emojiMatch)
        .then((res) => {
          console.log('tried to select emoji');
          if (res !== undefined) {
            console.log('found emoji in db');
            client.emojiDB.math(emojiMatch, '+', '1', 'uses')
              .then(() => {
                console.log('successfully updated emoji')
              })
              .catch((err) => client.handle(err, 'emoji increment in message event', message));
          }
        })
        .catch((err) => {
          client.handle(err, 'emoji select in message event', message);
        });
    }
    // Ignore messages not starting with the prefix
    if (message.content.indexOf(client.config.prefix) !== 0) return client.easter(message);
  }

  const permissionLevel = client.getHighestRole(client, message, message.member);

  // Our standard argument/command name definition.
  const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
  let command = args.shift().toLowerCase();

  // Grab the command data and aliases from the client.commands Enmap
  let cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

  // If that command doesn't exist, silently exit and do nothing
  if (!cmd) {
    if (message.guild) return client.easter(message);

    if (command.indexOf(client.config.prefix) === 0) {
      return;
    } else {
      args.unshift(command);
      args.unshift('dm');
      cmd = client.commands.get('modmail');
    }
  }

  if (cmd.help.name === 'modmail') {
    args.unshift(command);
  }

  if (!message.guild && cmd.conf.guildOnly && message.author.id !== client.config.botOwner) {
    return client.error(message.channel, 'Command Not Available in DMs!', 'This command is unavailable in DMs. Please use it in a server!');
  }

  if (cmd.conf.allowedChannels && client.config.botCommands !== message.channel.id && permissionLevel.level < 4) {
    return client.error(message.channel, 'Command Not Available in this Channel!', `You will have to use this command in one of the allowed channels: ${cmd.conf.allowedChannels.map((ch) => `<#${ch}>`).join(', ')}.`);
  }

  // eslint-disable-next-line prefer-destructuring
  message.author.permLevel = permissionLevel.level;

  const requiredLevel = client.levelCache.find((level) => {return level.name === cmd.conf.permLevel});

  if (permissionLevel.level < requiredLevel.level) {
    client.error(message.channel, 'Invalid Permissions!', `You do not currently have the proper permssions to run this command!\n**Current Level:** \`${permissionLevel.name}: Level ${permissionLevel.level}\`\n**Level Required:** \`${requiredLevel.name}: Level ${requiredLevel.level}\``);
    return console.log(`${message.author.tag} (${message.author.id}) tried to use cmd '${cmd.help.name}' without proper perms!`);
  }

  if (cmd.conf.args && (cmd.conf.args > args.length)) {
    return client.error(message.channel, 'Invalid Arguments!', `The proper usage for this command is \`${client.config.prefix}${cmd.help.usage}\`! For more information, please see the help command by using \`${client.config.prefix}help ${cmd.help.name}\`!`);
  }

  if (!cooldowns.has(cmd.help.name)) {
    cooldowns.set(cmd.help.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(cmd.help.name);
  const cooldownAmount = (cmd.conf.cooldown || 0) * 1000;

  if (timestamps.has(message.author.id)) {
    if (permissionLevel.level < 2) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        let timeLeft = (expirationTime - now) / 1000;
        let time = 'second(s)';
        if (cmd.conf.cooldown > 60) {
          timeLeft = (expirationTime - now) / 60000;
          time = 'minute(s)';
        }
        return client.error(message.channel, 'Woah There Bucko!', `Please wait **${timeLeft.toFixed(2)} more ${time}** before reusing the \`${cmd.help.name}\` command!`);
      }
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Run the command
  const guildUsed = message.guild ? `#${message.channel.name}` : 'DMs';

  console.log(`${message.author.tag} (${message.author.id}) ran cmd '${cmd.help.name}' in ${guildUsed}!`);
  cmd.run(client, message, args, permissionLevel.level, Discord);
};
