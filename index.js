/* eslint-disable consistent-return,linebreak-style */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const Discord = require('discord.js');
const Enmap = require('enmap');
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

const { botVersion } = require('./package.json');
const emoji = require('./src/emoji');
require('./src/functions')(client);

client.config = require('./config');

require('./src/dbUser')(client.db);

client.db.initialize();

client.version = `v${botVersion}`;
client.emoji = emoji;
client.token = process.env.TOKEN;
console.log(client.token);

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

client.commands = new Enmap();
client.aliases = new Enmap();

fs.readdir('./commands/', (err, folders) => {
  if (err) {
    return console.error(err);
  }

  // Looping over all folders to load all commands
  for (let i = 0; i < folders.length; i++) {
    fs.readdir(`./commands/${folders[i]}/`, (error, files) => {
      if (error) {
        return console.error(error);
      }
      files.forEach((file) => {
        const props = require(`./commands/${folders[i]}/${file}`);
        const commandName = props.help.name;
        if (!file.endsWith('.js')) {
          return;
        }

        console.log(`Attempting to load command ${commandName}`);
        client.commands.set(commandName, props);

        if (props.conf.aliases) {
          props.conf.aliases.forEach((alias) => {
            client.aliases.set(alias, commandName);
          });
        }

        client.db.enabledCommands.ensure(commandName, true);
      });
    });
  }
});

client.levelCache = {};
for (let i = 0; i < client.config.permLevels.length; i += 1) {
  const thisLevel = client.config.permLevels[i];
  client.levelCache[thisLevel.name] = thisLevel.level;
}

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
