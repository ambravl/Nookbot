// eslint-disable-next-line consistent-return
module.exports.run = async (client, message, args, level) => {
  if (args[0] && args[0].toLowerCase() === 'mod' && level < 3) return;
  let island = new Profile(client, message, args);
  island.run()
    .catch((err) => {
      client.handle(err, 'island')
    })
};

// noinspection SpellCheckingInspection
const islandAliases = {
  "bg": "background",
  "background": "background",
  "wallpaper": "background",
  "bio": "bio",
  "description": "bio",
  "desc": "bio",
  "biography": "bio",
  "island": "islandName",
  "islandname": "islandName",
  "in": "islandName",
  "townname": "islandName",
  "tn": "islandName",
  "fruit": "fruit",
  'fr': 'fruit',
  'f': 'fruit',
  'charactername': 'characterName',
  'character': 'characterName',
  'charname': 'characterName',
  'cn': 'characterName',
  'villagername': 'characterName',
  'vn': 'characterName',
  'islandername': 'characterName',
  'hemisphere': 'hemisphere',
  'hem': 'hemisphere',
  'hm': 'hemisphere',
  'hemi': 'hemisphere',
  'profilename': 'profileName',
  'profile': 'profileName',
  'pn': 'profileName',
  'switchname': 'profileName',
  'sn': 'profileName',
  'friendcode': 'friendCode',
  'fc': 'friendCode',
  'code':'friendCode',
  'remove':'remove',
  'delete':'remove',
  'rm':'remove',
  'del':'remove',
  'clear':'remove',
  'clr':'remove',
  'mod':'mod',
};

class Profile {
  constructor(client, message, args) {
    this.client = client;
    this.type = args[0] ? islandAliases[args[0].toLowerCase()] : 'search';
    this.type = this.type ? this.type : 'search';
    if (this.type === 'mod') {
      this.message = this.mod(args, message);
      if (typeof this.message.author === 'string') {
        this.send(this.message.author);
        return;
      }
      this.type = 'remove';
      this.info = this.validate(args.shift());
    } else {
      this.message = message;
      this.info = this.validate(args, message);
    }
  }

  async mod(args, message){
    let member = message.mentions.members.first();
      if (!member) {
        if (parseInt(args[1], 10)) {
          try {
            member = await this.client.users.fetch(args[1]);
          } catch (err) {
            console.log(err);
          }
        }
      }

      if (!member) {
        const searchedMember = this.client.searchMember(args[1]);
        if (searchedMember) {
          const decision = await this.client.reactPrompt(
            message,
            `Would you like to moderate \`${searchedMember.user.tag}\`'s island settings?`
          );
          if (decision) {
            member = searchedMember;
          } else {
            message.delete().catch((err) => console.error(err));
            return {channel: message.channel, author: 'noMod'}
          }
        }
      }

      if (!member) {
        return {channel: message.channel, author: 'invalid'};
      }
      return {
        channel: message.channel,
        author: member
      };

  }

  async run(){
    if (!this.info) this.send('invalid');
    if (this.info === 'none') this.send('none');
    else {
      if(this.type === 'search'){
        let playerInfo = [];
        this.client.userDB.ensure(this.info.id, '', '*')
          .then((res) => {
            if (res) {
              ['friendCode', 'profileName', 'characterName', 'islandName', 'fruit', 'hemisphere'].forEach((category) => {
                if (res[category]) {
                  playerInfo.push({
                    name: this.client.mStrings.island[category].name,
                    value: res[category],
                    inline: true
                  });
                }
              });
              if (res.bio) playerInfo.unshift(res.bio);
            }
            if (playerInfo.length < 1) {
              if (this.info.id === playerInfo.author.id) this.send('noneSelf');
              else this.send('noneOther');
            } else this.send('list', playerInfo)
          })

      } else {
        if (this.type === 'remove') {
          this.type = this.info;
          this.info = '';
        }
        this.set();
      }
    }
  }

  validate(args, message) {
    if (this.type !== 'search' && args.length === 1) {
      return 'none';
    }
    let info;
    switch (this.type) {
      case 'search':
        if (args && args.length > 0) {
          info = (
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            this.client.searchMember(args.join(' '))
          );
        } else info = message.member;
        break;
      case 'fruit':
        if (/apples?/i.test(args[1])) {
          info = 'Apples';
        } else if (/cherr(y|ies)/i.test(args[1])) {
          info = 'Cherries';
        } else if (/oranges?/i.test(args[1])) {
          info = 'Oranges';
        } else if (/peach(es)?/i.test(args[1])) {
          info = 'Peaches';
        } else if (/pears?/i.test(args[1])) {
          info = 'Pears';
        }
        break;
      case 'hemisphere':
        if (/north(ern)?/i.test(args[1])) {
          info = 'Northern';
        } else if (/south(ern)?/i.test(args[1])) {
          info = 'Southern';
        }
        break;
      case 'friendCode':
        info = args.slice(1).join().replace(/[\D]/g, '');

        if (info.length !== 12) {
          return undefined;
        }
        info = `SW-${info.slice(0, 4)}-${info.slice(4, 8)}-${info.slice(8, 12)}`;
        break;
      case 'remove':
        info = islandAliases[args[1].toLowerCase()];
        break;
      case 'background':
        if (message.attachments) {
          info = message.attachments.first().url;
        } else {
          if (!args[1].startsWith('http')) return undefined;
          if (!args[1].endsWith('.png') && !args[1].endsWith('.jpg') && !args[1].endsWith('.gif')) return undefined;
          info = args[1];
        }
        break;
      case 'bio':
        args.forEach((txt) => {
          if (txt.length > 45) return undefined;
        });
        info = args.slice(1).join(' ');
        if (info.length > 240) return undefined;
        break;
      default:
        info = args.slice(1).join(' ');
        if (info.length > 10) return undefined;
    }
    return info;
  }
  set(memberID){
    if(this.type === 'all'){
      this.client.userDB.multiUpdate(
        memberID ? memberID : this.message.author.id,
        ['', '', '', '', '', '',],
        ['islandName', 'fruit', 'characterName', 'hemisphere', 'profileName', 'friendCode']
      );
      this.send('remove', 'success');
    }
    this.client.userDB.safeUpdate(memberID ? memberID : this.message.author.id, this.info, this.type, false)
      .then(() => {
        this.send(this.type === '' ? 'clear' : 'success');
      })
      .catch((err) => {
        this.client.handle(err, 'set island info')
      })
  }

  send(event, playerInfo) {
    if (event === 'success') {
      this.client.success(
        this.message.channel,
        this.client.mStrings.island[this.type].success.title,
        this.client.mStrings.island[this.type], success.desc + ` **${this.info}**`
      );
    } else if (event === 'list') {
      const Discord = require('discord.js');
      const embed = new Discord.MessageEmbed()
        .setAuthor(`${this.info.displayName}'s Profile`, this.info.user.displayAvatarURL())
        .setColor('#0ba47d');
      if (typeof playerInfo[0] === 'string' || playerInfo[0] instanceof String) {
        embed.setDescription(playerInfo[0]);
        playerInfo.shift();
      }
      if (playerInfo) embed.addFields(playerInfo);
      this.message.channel.send(embed);
    }
    else{
      this.client.error(this.message.channel, this.client.mStrings.island[this.type][event].title, `${event === 'noneOther' ? this.info.displayName : ''}${this.client.mStrings.island[this.type][event].desc}`)
    }
  }
  search(){
    pass;
  }
}

module.exports.conf = {
  guildOnly: true,
  aliases: ['is', 'profile', 'rank'],
  permLevel: 'User',
  allowedChannels: true,
};

module.exports.help = {
  name: 'island',
  category: 'game',
  description: 'Profile information display',
  usage: 'island <islandname|fruit|charactername|hemisphere|profilename|friendcode> <name|fruit|hemisphere|code>',
  details: '<islandname> => Set the name of your \n<fruit> => Set the fruit that is native on your \n<charactername> => Set the name of your character on the \n<hemisphere> => Set the hemisphere your island is in.\n<profilename> => Set the name of your Switch profile.\n<friendcode> => Set your Switch friendcode.',
};
