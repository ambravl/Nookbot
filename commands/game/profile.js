// eslint-disable-next-line consistent-return
module.exports.run = async (client, message, args, level) => {
  if (args[0] && args[0].toLowerCase() === 'mod' && level < 3) return;
  if (args[0]) {
    let island = new Profile(client, message, args);
    island.run()
      .catch((err) => {
        client.handle(err, 'island')
      })
  } else {
    let profile = new Search(client, message, args);
    profile.send(client, message)
      .catch((err) => {
        client.handle(err, 'search profile')
      });
  }
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
  "island": "islandname",
  "islandname": "islandname",
  "in": "islandname",
  "townname": "islandname",
  "tn": "islandname",
  "fruit": "fruit",
  'fr': 'fruit',
  'f': 'fruit',
  'charactername': 'charactername',
  'character': 'charactername',
  'charname': 'charactername',
  'cn': 'charactername',
  'villagername': 'charactername',
  'vn': 'charactername',
  'islandername': 'charactername',
  'hemisphere': 'hemisphere',
  'hem': 'hemisphere',
  'hm': 'hemisphere',
  'hemi': 'hemisphere',
  'profilename': 'profilename',
  'profile': 'profilename',
  'pn': 'profilename',
  'switchname': 'profilename',
  'sn': 'profilename',
  'friendcode': 'friendcode',
  'fc': 'friendcode',
  'code': 'friendcode',
  'remove': 'remove',
  'delete': 'remove',
  'rm': 'remove',
  'del': 'remove',
  'clear': 'remove',
  'clr': 'remove',
  'mod': 'mod',
};

class Profile {
  constructor(client, message, args) {
    this.client = client;
    if (args[0]) this.type = islandAliases[args[0].toLowerCase()];
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


  async run() {
    if (!this.info) this.send('invalid');
    if (this.info === 'none') this.send('none');
    else {
        if (this.type === 'remove') {
          this.type = this.info;
          this.info = '';
        }
        this.set();
      }
  }

  validate(args, message) {
    if (args.length === 1) {
      return 'none';
    }
    let info;
    switch (this.type) {
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
        ['islandname', 'fruit', 'charactername', 'hemisphere', 'profilename', 'friendcode']
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
        this.client.mStrings.island[this.type].success.desc + ` **${this.info}**`
      );
    } else {
      this.client.error(this.message.channel, this.client.mStrings.island[this.type][event].title, `${this.client.mStrings.island[this.type][event].desc}`)
    }
  }
}

class Search extends Profile {
  constructor(client, message, args) {
    super(client, message, args);
    this.user = this.validate(message, args);
  }

  validate(message, args) {
    if (args && args.length > 0) {
      let info = message.mentions.members.first();
      if (!info) info = message.guild.members.cache.get(args[0]);
      if (!info) return undefined;
      return info;
    }
    return message.member;
  }

async makeImage(memberCount, color) {
  const Canvas = require('canvas');
  const canvas = Canvas.createCanvas(700, 200);
  const ctx = canvas.getContext('2d');
  const bg = this.userInfo.bg ? this.userInfo.bg : './src/bg.png';
  const background = await Canvas.loadImage(bg);
  ctx.fillStyle = ctx.createPattern(background, "repeat-x");
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const applyText = (canvas, text) => {
    const ctx = canvas.getContext('2d');

    // Declare a base size of the font
    let fontSize = 70;

    do {
      // Assign the font to the context and decrement it so it can be measured again
      ctx.font = `${fontSize -= 10}px sans-serif`;
      // Compare pixel width of the text to the canvas minus the approximate avatar size
      } while (ctx.measureText(text).width > canvas.width - 300);

      // Return the result to use in the actual canvas
      return ctx.font;
    };


    // Slightly smaller text placed above the member's display name
    ctx.font = '28px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${this.userInfo.rankRole ? this.userInfo.rankRole : 'Placeholder'} - #${this.userInfo.rank}/${memberCount}`, canvas.width / 2.5, canvas.height / 3.5);

  // Add an exclamation point here and below
  ctx.font = applyText(canvas, this.user.displayName);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(this.user.displayName, canvas.width / 2.5, canvas.height / 1.8);


  let posX = 200;
  let posY = 150;
  let width = 400;
  let height = 30;
  let number = 50;
  let percentage = number / 100 * width;
  // Visualize -------
  ctx.beginPath();
  ctx.arc(height / 2 + posX, height / 2 + posY, height / 2, Math.PI / 2, 3 / 2 * Math.PI);
  ctx.lineTo(width - height + posX, posY);
  ctx.arc(width - height / 2 + posX, height / 2 + posY, height / 2, 3 / 2 * Math.PI, Math.PI / 2);
  ctx.lineTo(height / 2 + posX, height + posY);
  ctx.strokeStyle = '#000000';
  ctx.stroke();
  ctx.closePath();
  // -----------------
  if (percentage <= height) {
    ctx.beginPath();
    ctx.arc(height / 2 + posX, height / 2 + posY, height / 2, Math.PI - Math.acos((height - percentage) / height), Math.PI + Math.acos((height - percentage) / height));
    ctx.save();
    ctx.scale(-1, 1);
    ctx.arc((height / 2) - percentage - posX, height / 2 + posY, height / 2, Math.PI - Math.acos((height - percentage) / height), Math.PI + Math.acos((height - percentage) / height));
    ctx.restore();
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.arc(height / 2 + posX, height / 2 + posY, height / 2, Math.PI / 2, 3 / 2 * Math.PI);
    ctx.lineTo(percentage - height + posX, posY);
    ctx.arc(percentage - (height / 2) + posX, height / 2 + posY, height / 2, 3 / 2 * Math.PI, Math.PI / 2);
    ctx.lineTo(height / 2 + posX, height + posY);
    ctx.closePath();
  }
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(100, 100, 75, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  const avatar = await Canvas.loadImage(this.user.user.displayAvatarURL({format: 'jpg'}));
  ctx.drawImage(avatar, 25, 25, 150, 150);

  return canvas.toBuffer();
}


  makeEmbed(strings, color, Discord) {
    const embed = new Discord.MessageEmbed()
      .setAuthor(`${this.user.displayName}'s Profile`, this.user.user.displayAvatarURL())
      .setColor(color);
    if (this.userInfo && this.userInfo.bio) embed.setDescription(this.userInfo.bio);
    let embeds = [];
    if (this.userInfo) {
      ['friendcode', 'profilename', 'charactername', 'islandname', 'fruit', 'hemisphere'].forEach((category) => {
        console.log(category);
        if (this.userInfo[category]) {
          embeds.push({
            name: strings[category].name,
            value: this.userInfo[category],
            inline: true
          });
        }
      });
      if (embeds) embed.addFields(embeds);
    }
    if (!this.userInfo || (!embeds && !this.userInfo.bio)) {
      embed.setDescription(strings.search.none);
    }
    return embed;
  }

  async send(client, message) {
    client.userDB.selectAll(this.user.id, true)
      .then(async (res) => {
        if (!res || !res.rows || res.rows.length === 0) return;
        else this.userInfo = res.rows[0];
        const Discord = require('discord.js');
        let role = message.guild.roles.cache.find((r) => r.name === this.userInfo.rankRole);
        const embed = this.makeEmbed(
          client.mStrings.island,
          role ? role.color : '#ffffff',
          Discord
        );
        const image = await this.makeImage(message.guild.memberCount, role ? role.color : '#ffffff');
        embed.attachFiles([new Discord.MessageAttachment(image)]);
        message.channel.send(embed);
      })
      .catch((err) => {
        client.handle(err, 'search constructor')
      });
  }

}

module.exports.conf = {
  guildOnly: true,
  aliases: ['is', 'profile', 'rank'],
  permLevel: 'User',
  allowedChannels: true,
};

module.exports.help = {
  name: 'profile',
  category: 'game',
  description: 'Profile information display',
  usage: 'profile <bio|background|islandname|fruit|charactername|hemisphere|profilename|friendcode> <bio|backgrounddurl|name|fruit|hemisphere|code>',
  details: '<islandname> => Set the name of your \n<fruit> => Set the fruit that is native on your \n<charactername> => Set the name of your character on the \n<hemisphere> => Set the hemisphere your island is in.\n<profilename> => Set the name of your Switch profile.\n<friendcode> => Set your Switch friendcode.',
};
