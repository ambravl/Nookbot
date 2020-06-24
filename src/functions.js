/* eslint-disable no-param-reassign */
const Discord = require('discord.js');
const moment = require('moment');

module.exports = (client) => {

  client.rankFinder = (oldPoints, total) => {
    for (let i = 0; i < client.ranks.length; i++) {
      console.log(client.ranks[i].minPoints);
      console.log(client.ranks[i - 1] ? client.ranks[i - 1].minPoints : '');
      if (client.ranks[i].minPoints > total && client.ranks[i - 1].minPoints > oldPoints) return client.ranks[i - 1];
    }
    return null;
  };

  client.easter = (message) => {
    const adjective = message.content.match(/(good|bad) bot/i);
    if (adjective) {
      console.log(adjective);
      if (adjective[1].toLowerCase() === 'good') message.channel.send("Thanks! I'm happy to help this happy little server!");
      else if (adjective[1].toLowerCase() === 'bad') {
        if (message.author.id === client.config.botOwner) message.channel.send('Bad programmer!');
        else message.channel.send(`Oh I'm sorry, could your happy little mind do better, ${message.author.username}?`)
      }
    }
  };

  class Checker {
    constructor(name) {
      this.count = 0;
      this.channels = client.config[`${name}Channels`];
      this.string = client.mStrings.filters[name];
      this.config = client.config[name];
    }

    delete(message) {
      message.delete();
      this.count += 1;
      if (this.count === 5) {
        this.count = 0;
        message.channel.send(this.string).then((autoMsg) => {
          setTimeout(() => {
            autoMsg.delete();
          }, 30000);
        })
      }
      return true;
    }

    checker(message) {
      if (this.channels && this.channels.includes(message.channel.id)) {
        if (!message.deleted && message.deletable) {
          return true;
        }
      }
      return false;
    }

    run(message) {
      if (this.checker(message)) return this.delete(message);
      else return false;
    }
  }

  class ImageChecker extends Checker {
    constructor() {
      super('imageOnly');
    }

    checker(message) {
      if (!super.checker(message)) return false;
      if (message.attachments.size === 0) return true;
    }
  }

  class NewlineChecker extends Checker {
    constructor() {
      super('newLineLimit');
    }

    checker(message) {
      if (!super.checker(message)) return false;
      if ((message.content.match(/\n/g) || []).length >= this.config) return true;
    }
  }

  class AttachmentChecker extends Checker {
    constructor() {
      super('imageLinkLimit');
    }

    checker(message) {
      if (!super.checker(message)) return false;
      if ((message.attachments.size + (message.content.match(/https?:\/\//gi) || []).length) >= this.config) return true;
    }
  }

  class MentionChecker extends Checker {
    constructor() {
      super('noMention');
    }

    checker(message) {
      if (!super.checker(message)) return false;
      if (message.mentions.members.size > 0) return true;
    }
  }

  client.checkers = [new AttachmentChecker(), new ImageChecker(), new MentionChecker(), new NewlineChecker()];

  client.handleReaction = async (client, messageReaction, user) => {
    if (user.bot || (messageReaction.message.guild && messageReaction.message.guild.id !== client.config.mainGuild)) {
      return;
    }

    let reactionRoleMenu = await client.reactionRoles.selectAll(messageReaction.message.id, false);

    // If not there isn't a type, then this is not a reaction role message.
    if (!reactionRoleMenu || !reactionRoleMenu.rows || reactionRoleMenu.rows.length < 1) {
      return client.handleModmailReactions(client, messageReaction, user);
    }

    reactionRoleMenu = reactionRoleMenu.rows[0];

    let result = {type: reactionRoleMenu.type, roles: [], emoji: [], roleid: ''};

    for (let reaction of reactionRoleMenu.reactions) {
      if (reaction.emojiID === messageReaction.emoji.id || reaction.emojiID === messageReaction.emoji.identifier || reaction.emojiID === messageReaction.emoji.name) {
        result.roleid = reaction.roleID;
      }
      result.roles.push(reaction.roleID);
      result.emoji.push(reaction.emojiID);
    }
    return result;
  };

  client.handleModmailReactions = async (client, messageReaction, user) => {
    if (messageReaction.message.channel.id !== client.config.modMail && messageReaction.message.channel.id !== client.config.reportMail) return;
    if (messageReaction.count > 2) return;
    client.modMailDB.selectAll(messageReaction.message.id, false)
      .then(async (res) => {
        if (!res || !res.rows || res.rows.length < 1) return;
        const Discord = require('discord.js');
        const modmail = res.rows[0];
        const newEmbed = new Discord.MessageEmbed(messageReaction.message.embeds[0]);
        newEmbed.setTimestamp();
        const DMChannel = await client.users.cache.get(modmail.memberid).createDM();
        const DMMessage = DMChannel.messages.cache.get(modmail.dmid);
        const DMEmbed = new Discord.MessageEmbed(DMMessage.embeds[0]);
        DMEmbed.setTimestamp();
        let values;
        if (modmail.mailtype === 'suggestion') {
          let count = {'down': 0, 'up': 0, 'love': 0};
          messageReaction.message.reactions.cache.each((reaction) => {
            if (reaction.emoji.name === '💞') count.love = reaction.count - 1;
            else if (reaction.emoji.name === '❎') count.down = reaction.count - 1;
            else if (reaction.emoji.name === '✅') count.up = reaction.count - 1;
          });
          const total = count.up + count.down + count.love;
          const score = total ? Math.floor(100 * (count.up + (1.5 * count.love) - count.down) / total) : '--';
          newEmbed.setFooter(`Total Score: ${score}%`);
          messageReaction.message.edit(newEmbed).catch((err) => {
            client.handle(err)
          });
          return;
        }
        newEmbed.fields = [];
        if (messageReaction.emoji.name === '❗' && modmail.status !== 'open') {
          const embed = new Discord.MessageEmbed()
            .setTitle('Ticket Reopened!')
            .setDescription(`${user.username} reopened ticket #${messageReaction.message.id}!`)
            .setURL(`https://discordapp.com/channels/717575621420646432/${messageReaction.me.channel.id}/${messageReaction.message.id}`)
            .setColor('#ff0000');
          messageReaction.message.channel.send(embed);
          values = {
            footer: `Reopened by ${user.username} at`,
            emoji1: '❕',
            desc1: 'I got this!',
            emoji2: '✅',
            desc2: 'Complete',
            dmFooter: 'Ticket reopened on',
            status: 'open'
          };

        } else if (messageReaction.emoji.name === '❕' && modmail.status !== 'read') {
          values = {
            footer: `Assigned to ${user.username} at`,
            emoji1: '❗',
            desc1: 'I need help!',
            emoji2: '✅',
            desc2: 'Complete',
            dmFooter: 'We started working on it on',
            status: 'read'
          }
        } else if (messageReaction.emoji.name === '✅' && modmail.status !== 'complete') {
          values = {
            footer: `Closed by ${user.username} at`,
            emoji1: '❕',
            desc1: 'On second thought...',
            emoji2: '❗',
            desc2: 'Reopen and ask for help',
            dmFooter: 'Ticket closed on',
            status: 'complete'
          }
        }
        newEmbed.addField(values.emoji1, values.desc1, true).addField(values.emoji2, values.des2, true).setFooter(values.footer);
        const colorPercentage = 100 + (25 * ((values.status === 'open') + (modmail.status === 'complete') - (values.status === 'complete') - (modmail.status === 'open')));
        newEmbed.setColor(client.dimColor(messageReaction.message.embeds[0].color, colorPercentage));
        DMEmbed.setFooter(values.dmFooter);
        messageReaction.message.edit(newEmbed).catch((err) => {
          client.handle(err, 'editing message', messageReaction.message)
        });
        DMMessage.edit(DMEmbed).catch((err) => {
          client.handle(err, 'editing DM', messageReaction.message)
        });
        messageReaction.message.reactions.removeAll()
          .then(() => {
            messageReaction.message.react(values.emoji1);
            messageReaction.message.react(values.emoji2);
          });
        client.modMailDB.update(messageReaction.message.id, values.status, 'status');
        client.modMail[messageReaction.message.id] = values.status;
      })
  };

  client.dimColor = (color, percentage) => {
    const hex = color.toString(16);
    let res = '';
    for (let i = 0; i < 6; i += 2) {
      let clr = hex.slice(i, i + 2);
      clr = parseInt(clr, 16) * percentage / 100;
      clr = clr.toString(16);
      res += clr;
    }
    return res;
  };

  client.clean = async (clientParam, txt) => {
    let text = txt;
    if (text && text.constructor.name === 'Promise') {
      text = await text;
    }
    if (typeof text !== 'string') {
      // eslint-disable-next-line global-require
      text = require('util').inspect(text, { depth: 1 });
    }

    text = text
      .replace(/`/g, `\`${String.fromCharCode(8203)}`)
      .replace(/@/g, `@${String.fromCharCode(8203)}`)
      .replace(clientParam.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');

    return text;
  };

  client.success = (channel, suc, msg) => {
    channel.send(`${client.emoji.checkMark} **${suc}**\n${msg}`, { split: true });
  };

  client.error = (channel, err, msg) => {
    channel.send(`${client.emoji.redX} **${err}**\n${msg}`, { split: true });
  };

  client.compareTimes = (times, units) => {

    // Grab the top 3 units of time that aren't 0
    let outTimes = '';
    let c = 0;
    for (let t = 0; t < units.length && c !== 3; t++) {
      if (times[t] > 0) {
        outTimes += `${c === 1 ? '|' : ''}${c === 2 ? '=' : ''}${times[t]} ${units[t]}${times[t] === 1 ? '' : 's'}`;
        c += 1;
      }
    }

    if (outTimes.includes('=')) {
      return outTimes.replace('|', ', ').replace('=', ', and ');
    } else {
      return outTimes.replace('|', ' and ');
    }

  };

  client.humanTimeBetween = (time1, time2) => {
    const timeDif = moment.duration(moment(time1 < time2 ? time2 : time1).diff(moment(time1 < time2 ? time1 : time2)));

    const times = [
      timeDif.years(),
      timeDif.months(),
      timeDif.days(),
      timeDif.hours(),
      timeDif.minutes(),
      timeDif.seconds(),
    ];

    const units = ['year', 'month', 'day', 'hour', 'minute', 'second'];

    return client.compareTimes(times, units) || '0 seconds';
  };

  client.regexCount = (regexp, str) => {
    if (typeof regexp !== 'string') {
      return 0;
    }
    let re = regexp === '.' ? `\\${regexp}` : regexp;
    re = re === '' ? '.' : re;
    return ((str || '').match(new RegExp(re, 'g')) || []).length;
  };

  client.reactPrompt = async (message, question, opt) => {
    if (!opt) {
      const confirm = await message.channel.send(question);
      await confirm.react(client.emoji.checkMark);
      await confirm.react(client.emoji.redX);

      const filter = (reaction, user) => [client.emoji.checkMark, client.emoji.redX].includes(reaction.emoji.name)
          && user.id === message.author.id;

      let decision = false;
      await confirm.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
        .then((collected) => {
          const reaction = collected.first();

          if (reaction.emoji.name === client.emoji.checkMark) {
            decision = true;
          }
        })
        .catch(() => {
          console.log('React Prompt timed out.');
        });
      await confirm.delete();
      return decision;
    }
    let counter = 0x1F1E6;
    let body = question;
    opt.slice(0, 20).forEach((option) => {
      body += `\n${String.fromCodePoint(counter)} : \`${option}\``;
      counter += 1;
    });
    const confirm = await message.channel.send(body);
    // UGLY
    counter = 0x1F1E6;
    const emojiList = [];
    await client.asyncForEach(opt.slice(0, 20), async () => {
      emojiList.push(String.fromCodePoint(counter));
      await confirm.react(String.fromCodePoint(counter));
      counter += 1;
    });
    const filter = (reaction, user) => emojiList.includes(reaction.emoji.name)
          && user.id === message.author.id;

    let decision = '';
    await confirm.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
      .then((collected) => {
        const reaction = collected.first();

        decision = opt[reaction.emoji.toString().codePointAt(0) - 0x1F1E6];
      })
      .catch(() => {
        console.log('React Prompt timed out.');
      });
    await confirm.delete();
    return decision;
  };

  client.asyncForEach = async (array, callback) => {
    for (let i = 0; i < array.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await callback(array[i], i, array);
    }
  };

  // FIXME
  client.searchMember = (name, threshold = 0.5) => undefined;

  client.clearSongQueue = () => {
    client.songQueue.stopping = true;
    if (client.songQueue.connection) {
      client.songQueue.connection.disconnect();
    }
    client.songQueue.connection = null;
    client.songQueue.voiceChannel = null;
    client.songQueue.songs = [];
    client.songQueue.infoMessage = null;
    client.songQueue.playing = false;
    client.songQueue.played = 0;
    client.songQueue.timePlayed = 0;
    client.songQueue.lastUpdateTitle = '';
    client.songQueue.lastUpdateDesc = '';
    client.songQueue.stopping = false;
  };

  client.raidModeActivate = async (guild) => {
    // Enable Raid Mode
    client.raidMode = true;
    // Save @everyone role and staff/action log channels here for ease of use.
    const {everyone} = guild.roles;
    const staffChat = guild.channels.cache.get(client.config.staffChat);
    const joinLeaveLog = guild.channels.cache.get(client.config.joinLeaveLog);

    const announcements = guild.channels.cache.get(client.config.announcementsChannel);

    await announcements.send(client.mStrings.raid.raidAnnouncement);

    // Create a Permissions object with the permissions of the @everyone role, but remove Send Messages.
    const perms = new Discord.Permissions(everyone.permissions).remove('SEND_MESSAGES');
    await everyone.setPermissions(perms);

    // Send message to staff with prompts
    // FIXME
    client.raidMessage = await staffChat.send(`**##### RAID MODE ACTIVATED #####**
<@&495865346591293443> <@&494448231036747777>

A list of members that joined in the raid is being updated in <#689260556460359762>.
This message updates every 5 seconds, and you should wait to decide until the count stops increasing.

If you would like to remove any of the members from the list, use the \`.raidremove <ID>\` command.

Would you like to ban all ${client.raidJoins.length} members that joined in the raid?`);
    await client.raidMessage.react(client.emoji.checkMark);
    await client.raidMessage.react(client.emoji.redX);
    // Listen for reactions and log which action was taken and who made the decision.
    const filter = (reaction, user) => [client.emoji.checkMark, client.emoji.redX].includes(reaction.emoji.name)
        && guild.members.fetch(user).then((m) => m.hasPermission('BAN_MEMBERS')) && !user.bot;
    client.raidMessage.awaitReactions(filter, { max: 1 })
      .then(async (collected) => {
        const reaction = collected.first();
        const modUser = reaction.users.cache.last();
        if (reaction.emoji.name === client.emoji.checkMark) {
          // A valid user has selected to ban the raid party.
          // Log that the banning is beginning and who approved of the action.
          client.success(
            staffChat,
            client.mStrings.raid.banned.title,
            `User ${modUser.tag} ${client.mStrings.raid.banned.description}`
          );
          client.raidBanning = true;
          // Create a setInterval to ban members without rate limiting.
          const interval = setInterval(() => {
            if (client.raidJoins.length === 0) {
              // We've finished banning, announce that raid mode is ending.
              staffChat.send('Finished banning all raid members. Raid Mode is deactivated.');
              joinLeaveLog.send(`The above ${client.raidMembersPrinted} members have been banned.`);
              // Reset all raid variables
              client.raidMode = false;
              // Deactivate Raid Banning after a few seconds to allow for other events generated to finish
              setTimeout(() => {
                client.raidBanning = false;
              }, 15000);
              client.raidJoins = [];
              client.raidMessage = null;
              client.raidMembersPrinted = 0;
              // Allow users to send messages again.
              perms.add('SEND_MESSAGES');
              everyone.setPermissions(perms);
              clearInterval(interval);
              announcements.send(client.mStrings.raid.raidEnded);
            } else {
              // Ban the next member
              client.raidJoins.shift().ban({days: 1, reason: 'Member of raid.'})
                .catch(console.error);
            }
          }, 100); // 100 ms is 10 bans a second, hopefully not too many.
        } else {
          // A valid user has selected not to ban the raid party.
          client.error(staffChat, 'Not Banning!', `User ${modUser.tag} has chosen to not ban the raid. Raid Mode is deactivated.`);
          // Reset all raid variables
          client.raidMode = false;
          client.raidJoins = [];
          client.raidMessage = null;
          client.raidMembersPrinted = 0;
          // Allow users to send messages again.

          perms.add('SEND_MESSAGES');
          await everyone.setPermissions(perms);
          announcements.send(client.mStrings.raid.raidEnded);
        }
      })
      .catch(console.error);
    // If there are new joins, regularly log them to nook-log and update the message with the count
    let msg = '**##### RAID MODE ACTIVATED #####**\nBELOW IS A LIST OF ALL MEMBERS THAT JOINED IN THE RAID';
    const updateRaid = setInterval(() => {
      // If the raid is over, don't update anymore.
      if (!client.raidMode) {
        clearInterval(updateRaid);
      } else if (!client.raidBanning) {
        // FIXME
        client.raidMessage.edit(`**##### RAID MODE ACTIVATED #####**
<@&495865346591293443> <@&494448231036747777>

A list of members that joined in the raid is being updated in <#689260556460359762>.
This message updates every 5 seconds, and you should wait to decide until the count stops increasing.

If you would like to remove any of the members from the list, use the \`.raidremove <ID>\` command.

Would you like to ban all ${client.raidJoins.length} members that joined in the raid?`);
        // Grab all the new raid members since last update.
        if (client.raidMembersPrinted !== client.raidJoins.length) {
          const newMembers = client.raidJoins.slice(client.raidMembersPrinted);
          client.raidMembersPrinted += newMembers.length;
          newMembers.forEach((mem) => {
            msg += `\n${mem.user.tag} (${mem.id})`;
          });
          joinLeaveLog.send(msg, { split: true });
          // UGLY
          msg = '';
        }
      }
    }, 5000);
  };

  // eslint-disable-next-line no-extend-native
  Object.defineProperty(String.prototype, 'toProperCase', {
    value() {
      return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    },
  });
};
