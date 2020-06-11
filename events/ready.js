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

      // Emoji usage tracking database init
      guild.emojis.cache.forEach((e) => {
        // If EmojiDB does not have the emoji, add it.
        if (!client.emojiDB.has(e.id)) {
          client.emojiDB.set(e.id, 0);
        }
      });
      // Sweep emojis from the DB that are no longer in the guild emojis
      client.emojiDB.sweep((v, k) => !guild.emojis.cache.has(k));

      setInterval(() => {
        client.memberStats.set(client.memberStats.autonum, { time: Date.now(), members: guild.memberCount });
        client.user.setActivity(`ACNH with ${guild.memberCount} users!`);
      }, 30000);

      // Save the current collection of guild invites.
      guild.fetchInvites().then((guildInvites) => {
        client.invites = guildInvites;
      });

      // Clear any session channels from the server if they have no members
      client.sessionDB.keyArray().forEach((sesID) => {
        const sessionChannel = client.channels.cache.get(sesID);
        if (sessionChannel && sessionChannel.members.size === 0
            && !sessionChannel.deleted && sessionChannel.deletable) {
          // Session is empty, delete the channel and database entry
          sessionChannel.delete('[Auto] Purged empty session channels on ready event.').then((delChannel) => {
            // Delete sessionDB entry
            client.sessionDB.delete(delChannel.id);
          }).catch((error) => {
            console.error(error);
          });
        }
      });

      // Reschedule any unmutes from muteDB
      const now = Date.now();
      client.muteDB.keyArray().forEach((memID) => {
        const unmuteTime = client.muteDB.get(memID);
        guild.members.fetch(memID).then((member) => {
          if (unmuteTime < now) {
            // Immediately unmute
            client.muteDB.delete(memID);
            member.roles.remove('495854925054607381', 'Scheduled unmute through reboot.');
          } else {
            // Schedule unmute
            setTimeout(() => {
              if ((client.muteDB.get(memID) || 0) < Date.now()) {
                client.muteDB.delete(memID);
                member.roles.remove('495854925054607381', 'Scheduled unmute through reboot.');
              }
            }, unmuteTime - now);
          }
        }).catch(() => {
          // Probably no longer a member, don't schedule their unmute and remove entry from DB.
          client.muteDB.delete(memID);
        });
      });

      // Cache messages for reaction roles
      client.reactionRoleDB.keyArray().forEach((msgID) => {
        const { channel } = client.reactionRoleDB.get(msgID);
        client.channels.cache.get(channel).messages.fetch(msgID);
      });

      try {
        client.startTwitterFeed();
      } catch (err) {
        // The stream function returned an error
        console.error(err);
      }

      // Logging a ready message on first boot
      console.log(`Ready sequence finished, with ${guild.memberCount} users, in ${guild.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    }, 1000);
  } else {
    console.log('########## We had a second ready event trigger for some reason. ##########');
  }
};
