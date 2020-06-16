/* eslint-disable max-len */
/* eslint-disable consistent-return */
const Discord = require('discord.js');

const cooldowns = new Discord.Collection();

module.exports = async (client, message) => {
  // Ignore all bots
  if (message.author.bot) return;

  // User activity tracking
  client.userDB.update(message.author.id, message.createdTimestamp, 'lastMessageTimestamp');

  // Emoji finding and tracking
  const regex = /<a?:\w+:([\d]+)>/g;
  const msg = message.content;
  let regMatch;
  while ((regMatch = regex.exec(msg)) !== null) {
    // If the emoji ID is in our emoji, then increment its count
    client.emojiDB.select(regMatch[1])
      .then((rows) => {
        if(rows) client.emojiDB.math(regMatch[1], rows[0].uses, 1, 'uses')
          .catch((err) => client.handle(err, 'emoji increment in message event', Discord, message));
      })
      .catch((err) => {
        client.handle(err, 'emoji select in message event', Discord, message);
      });
  }

  if (message.guild && !message.member) {
    await message.guild.members.fetch(message.author);
  }

  // Anti Mention Spam
  if (message.mentions.members && message.mentions.members.size > 10) {
    // They mentioned more than 10 members, automute them for 10 mintues.
    if (message.member && client.permLevel(message).level < 4) {
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

  // Delete non-image containing messages from image only channels
  if (message.guild && client.config.imageOnlyChannels.includes(message.channel.id)
      && message.attachments.size === 0 && client.permLevel(message).level < 4) {
    // Message is in the guild's image only channels, without an image or link in it, and is not a mod's message, so delete
    if (!message.deleted && message.deletable) {
      message.delete();
      client.imageOnlyFilterCount += 1;
      if (client.imageOnlyFilterCount === 5) {
        client.imageOnlyFilterCount = 0;
        const autoMsg = await message.channel.send('Image Only Channel!\nThis channel only allows posts with images or links in them. Everything else is automatically deleted.');
        setTimeout(() => {
          autoMsg.delete();
        }, 30000);
      }
    }
    return;
  }

  // Delete posts with too many new line characters or images to prevent spammy messages in trade channels
  if (message.guild && client.config.newlineLimitChannels.includes(message.channel.id)
      && ((message.content.match(/\n/g) || []).length >= client.config.newlineLimit
      || (message.attachments.size + (message.content.match(/https?:\/\//gi) || []).length) >= client.config.imageLinkLimit)
      && client.permLevel(message).level < 4) {
    // Message is in the guild, in a channel that has a limit on newline characters, and has too many or too many links + attachments, and is not a mod's message, so delete
    if (!message.deleted && message.deletable) {
      message.delete();
      client.newlineLimitFilterCount += 1;
      if (client.newlineLimitFilterCount === 5) {
        client.newlineLimitFilterCount = 0;
        const autoMsg = await message.channel.send('Too Many New Lines or Attachments + Links!\nThis channel only allows posts with less than 10 newline characters and less than 3 attachments + links in them. Messages with more than that are automatically deleted.');
        setTimeout(() => {
          autoMsg.delete();
        }, 30000);
      }
    }
    return;
  }

  // Delete posts with @ mentions in villager and turnip channels
  if (message.guild && client.config.noMentionChannels.includes(message.channel.id)
    && message.mentions.members.size > 0
    && client.permLevel(message).level < 3) {
  // Message is in the guild, in a channel that restricts mentions, and is not a mod's message, so delete
    if (!message.deleted && message.deletable) {
      message.delete();
      client.noMentionFilterCount += 1;
      if (client.noMentionFilterCount === 5) {
        client.noMentionFilterCount = 0;
        const autoMsg = await message.channel.send('No Mention Channel!\nThis channel is to be kept clear of @ mentions of any members. Any message mentioning another member will be automatically deleted.');
        setTimeout(() => {
          autoMsg.delete();
        }, 30000);
      }
    }
    return;
  }

  // Ignore messages not starting with the prefix
  if (message.content.indexOf(client.config.prefix) !== 0) {
    return;
  }

  const permissionLevel = client.permLevel(message);

  // Our standard argument/command name definition.
  const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Grab the command data and aliases from the client.commands Enmap
  const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

  // If that command doesn't exist, silently exit and do nothing
  if (!cmd) {
    return;
  }

  if (permissionLevel.level < 4) {
    return client.error(message.channel, 'Command Disabled!', 'This command is currently disabled!');
  }

  if (!message.guild && cmd.conf.guildOnly) {
    return client.error(message.channel, 'Command Not Available in DMs!', 'This command is unavailable in DMs. Please use it in a server!');
  }

  if (cmd.conf.blockedChannels && cmd.conf.blockedChannels.includes(message.channel.id) && permissionLevel.level < 4) {
    return client.error(message.channel, 'Command Not Available in this Channel!', 'Please use it in the right channel!');
  }

  if (cmd.conf.allowedChannels && !cmd.conf.allowedChannels.includes(message.channel.id) && permissionLevel.level < 4) {
    return client.error(message.channel, 'Command Not Available in this Channel!', `You will have to use this command in one of the allowed channels: ${cmd.conf.allowedChannels.map((ch) => `<#${ch}>`).join(', ')}.`);
  }

  // eslint-disable-next-line prefer-destructuring
  message.author.permLevel = permissionLevel.level;

  if (permissionLevel.level < client.levelCache[cmd.conf.permLevel].level) {
    client.error(message.channel, 'Invalid Permissions!', `You do not currently have the proper permssions to run this command!\n**Current Level:** \`${permissionLevel.name}: Level ${permissionLevel.level}\`\n**Level Required:** \`${cmd.conf.permLevel}: Level ${client.levelCache[cmd.conf.permLevel].level}\``);
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
