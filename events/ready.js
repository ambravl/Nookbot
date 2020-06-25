module.exports = (client) => {
  if (!client.firstReady) {
    let counter = 1;
    client.firstReady = true;
    console.log('First ready event triggered, loading the guild.');
    const intv = setInterval(() => {
      const guild = client.guilds.cache.first();
      if (!guild) {
        console.log(`  Attempting to wait for guild to load ${counter}...`);
        counter += 1;
        return;
      }
      clearInterval(intv);
      console.log('Guild successfully loaded.');

      setInterval(() => {
        client.user.setActivity(`ACNH with ${guild.memberCount} users!`);
      }, 30000);

      // Save the current collection of guild invites.
      guild.fetchInvites().then((guildInvites) => {
        client.invites = guildInvites;
      });

      // Clear any session channels from the server if they have no members
      client.voiceSessions.cacheDB()
        .then((res) => {
          res.rows.forEach((session) =>
          {
            const sessionChannel = client.channels.cache.get(session.channelID);
            if (sessionChannel && sessionChannel.members.size === 0
              && !sessionChannel.deleted && sessionChannel.deletable) {
              // Session is empty, delete the channel and database entry
              sessionChannel.delete('[Auto] Purged empty session channels on ready event.').then((delChannel) => {
                // Delete voiceSessions entry
                client.voiceSessions.delete(delChannel.id);
              }).catch((error) => {
                console.error(error);
              });
            }
          })})
            .catch((err) => client.handle(err, 'voice sessions on ready'));

      // Reschedule any unmutes from mutedUsers
      const now = Date.now();
      client.mutedUsers.cacheDB().then((res) => {
        res.rows.forEach((row) => {
          const unmuteTime = row.time;
          guild.members.fetch(row.memberid).then((member) => {
            if (unmuteTime < now) {
              // Immediately unmute
              client.mutedUsers.delete(row.memberid);
              member.roles.remove(client.config.mutedRole, 'Scheduled unmute through reboot.');
            } else {
              // Schedule unmute
              setTimeout(() => {
                if ((row.time || 0) < Date.now()) {
                  client.mutedUsers.delete(row.memberid);
                  member.roles.remove(client.config.mutedRole, 'Scheduled unmute through reboot.');

                }
              }, unmuteTime - now);
            }
          }).catch(() => {
            client.mutedUsers.delete(row.memberid)
          });
        })
      }).catch((err) => { client.handle(err, 'scheduled unmute') });

      // Cache messages for reaction roles
      client.reactionRoles.cacheDB()
        .then((res) => {
          res.rows.forEach((msg) => {
            client.channels.cache.get(msg.channelid).messages.fetch(msg.messageid);
          })
        })
        .catch((err) => {
          client.handle(err, 'caching reaction roles')
        });

      client.suggestions = [];
      client.modMail = {};
      client.cachedMsgPoints = {};

      client.modMailDB.cacheDB()
        .then((res) => {
          const modMailChannel = client.channels.resolve(client.config.modMail).messages;
          const reportChannel = client.channels.resolve(client.config.reportMail).messages;
          modMailChannel.fetch('725331823915434004').then((msg) => {
            client.modMailPin = msg;
          });
          reportChannel.fetch('725331519912280125').then((msg) => {
            client.reportPin = msg
          });
          res.rows.forEach((mail) => {
            if (mail.mailtype === 'suggestion') {
              client.suggestions.push(mail.messageid);
              modMailChannel.fetch(mail.messageid);
            } else {
              client.modMail[mail.messageid] = mail.status;
              if (mail.mailtype === 'report' || mail.mailtype === 'scam') reportChannel.fetch(mail.messageid);
              else modMailChannel.fetch(mail.messageid);
            }

          })
        })
        .catch((err) => {
          client.handle(err, 'caching modmails')
        });

      // Logging a ready message on first boot
      console.log(`Ready sequence finished, with ${guild.memberCount} users, in ${guild.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
      client.users.cache.get(client.config.botOwner).createDM().then((channel) => channel.send("i'm up!"))
    }, 1000);
  } else {
    console.log('########## We had a second ready event trigger for some reason. ##########');
  }
};
