/* eslint-disable max-len */
const config = {
  // Raid Settings
  raidJoinsPerSecond: 10,
  raidJoinCount: 10,

  // Settings
  prefix: '.',
  staffChat: '720568062490705931',
  modMail: '720568062490705931',
  actionLog: '720568062490705931',
  joinLeaveLog: '720568062490705931',
  modLog: '720568062490705931',

  // Image-Only channels
  imageOnlyChannels: ['718192476828991550'],

  // Newline Limit Settings
  newlineLimitChannels: [],
  newlineLimit: 10,
  imageLinkLimit: 3,

  // No-Mention channels
  noMentionChannels: ['718192476828991550'],

  // Reputation Settings
  negativeRepLimit: 20,
  positiveRepLimit: 20,

  banAppealLink: 'LINK',

  // users
  usersDefaults: {
    friendCode: '',
      islandName: '',
      fruit: '',
      characterName: '',
      hemisphere: '',
      profileName: '',
    positiveRep: 0,
    negativeRep: 0,
    posRepList: [],
    negRepList: [],
    roles: [],
    nicknames: [],
    usernames: [],
    infractions: [[]],
    lastMessageTimestamp: 0,
  },

  // Bot Perms and Stuff
  ownerID: '258373545258778627',

  // Guild Perms and Stuff
  permLevels: [
    {
      level: 0,
      name: 'User',
      check: () => true,
    },
    {
      level: 1,
      name: 'Verified',
      check: (client, message) => {
        if (message.guild) {
          const verifiedRoleObj = message.guild.roles.cache.get(config.verifiedRole);

          if (verifiedRoleObj && message.member.roles.cache.has(verifiedRoleObj.id)) {
            return true;
          }
        }
        return false;
      },
    },
    {
      level: 2,
      name: 'Redd',
      check: (client, message) => {
        if (message.guild) {
          const reddObj = message.guild.roles.cache.get(config.reddRole);

          if (reddObj && message.member.roles.cache.has(reddObj.id)) {
            return true;
          }
        }
        return false;
      },
    },
    {
      level: 3,
      name: 'Head Redd',
      check: (client, message) => {
        if (message.guild) {
          const headReddObj = message.guild.roles.cache.get(config.headReddRole);

          if (headReddObj && message.member.roles.cache.has(headReddObj.id)) {
            return true;
          }
        }
        return false;
      },
    },
    {
      level: 4,
      name: 'Mod',
      check: (client, message) => {
        if (message.guild) {
          const modRoleObj = message.guild.roles.cache.get(config.modRole);

          if (modRoleObj && message.member.roles.cache.has(modRoleObj.id)) {
            return true;
          }
        }
        return false;
      },
    },
    {
      level: 5,
      name: 'Head Mod',
      check: (client, message) => {
        if (message.guild) {
          const headModRoleObj = message.guild.roles.cache.get(config.headModRole);

          if (headModRoleObj && message.member.roles.cache.has(headModRoleObj.id)) {
            return true;
          }
        }
        return false;
      },
    },
    {
      level: 6,
      name: 'Admin',
      check: (client, message) => {
        if (message.guild) {
          const adminRoleObj = message.guild.roles.cache.get(config.adminRole);

          if ((adminRoleObj && message.member.roles.cache.has(adminRoleObj.id)) || message.member.hasPermission('ADMINISTRATOR')) {
            return true;
          }
        }
        return false;
      },
    },
    {
      level: 7,
      name: 'Server Owner',
      check: (client, message) => !!(message.guild && message.author.id === message.guild.ownerID),
    },
    {
      level: 8,
      name: 'Bot Support',
      check: (client, message) => config.support.includes(message.author.id),
    },
    {
      level: 9,
      name: 'Bot Admin',
      check: (client, message) => config.admins.includes(message.author.id),
    },
    {
      level: 10,
      name: 'Bot Owner',
      check: (client, message) => config.ownerID === message.author.id,
    },
  ],
};

module.exports = config;
