/* eslint-disable consistent-return,linebreak-style */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client({
  messageCacheMaxSize: 500,
  fetchAllMembers: false,
  ws: {
    intents: [
      Discord.Intents.FLAGS.GUILDS,
      Discord.Intents.FLAGS.GUILD_MEMBERS,
      Discord.Intents.FLAGS.GUILD_BANS,
      Discord.Intents.FLAGS.GUILD_EMOJIS,
      Discord.Intents.FLAGS.GUILD_VOICE_STATES,
      Discord.Intents.FLAGS.GUILD_PRESENCES,
      Discord.Intents.FLAGS.GUILD_MESSAGES,
      Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Discord.Intents.FLAGS.DIRECT_MESSAGES,
      Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
  },
});
const strings = require('./src/strings.json');
const { botVersion } = require('./package.json');
const emoji = require('./src/emoji');
require('./src/error-handler')(client);
require('./src/dbUser')(client);

client.version = `v${botVersion}`;
client.emoji = emoji;
client.mStrings = strings;
client.token = process.env.TOKEN;

client.initializeDB()
  .catch((err) => {
    client.handle(err, 'initialize')
  })
  .then(() => {
    require('./config')(client);
  })
  .catch((err) => {
    client.handle(err, 'require config')
  })
  .then(() => {
    require('./src/functions')(client);
    require('./src/load-commands')(client);

  })

fs.readdir('./events/', (err, files) => {
  if (err) {
    return console.error(err);
  }
  return files.forEach((file) => {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
  });
});


client.firstReady = false;

client.invites = {};

// Raid Mode
client.raidMode = false;
client.raidBanning = false;
client.raidJoins = [];
client.raidMessage = null;
client.raidMembersPrinted = 0;

// Music Feature
client.songQueue = {
  infoMessage: null,
  voiceChannel: null,
  connection: null,
  songs: [],
  playing: false,
  shuffle: true,
  stopping: false,
  played: 0,
  timePlayed: 0,
  lastUpdateTitle: '',
  lastUpdateDesc: '',
};

// Auto-Filter Message Reminder Counts
client.imageOnlyFilterCount = 0;
client.newlineLimitFilterCount = 0;
client.noMentionFilterCount = 0;

client.login(client.token).then(() => {
  console.log('Bot successfully logged in.');
}).catch(() => {
  let counter = 1;
  console.log('Retrying client.login()...');
  const interval = setInterval(() => {
    console.log(`  Retrying attempt ${counter}`);
    counter += 1;
    client.login(client.token).then(() => {
      console.log('  Bot successfully logged in.');
      clearInterval(interval);
    });
  }, 30000);
});
