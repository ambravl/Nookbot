module.exports.run = (client, message, args) => {
  const emoji = new EmojiList(client, message, args);
  emoji.run()
    .catch((err) => {client.handle(err, 'emojiStats', message)})
};

const types = {
  't': "DESC",
  "top":"DESC",
  "b":'ASC',
  'bottom':'ASC',
  'm': '>',
  'more':'>',
  'l':'<',
  'less':'<'
};

class EmojiList{
  constructor(client, message, args) {
    this.args = args;
    const info = this.validate(args);
    this.type = info.type;
    this.value = info.value;
    this.message = message;
    this.client = client;
  }

  validate(args) {
    // UGLY look at the size of this thing
    const num = parseInt(args[1], 10);
    let validated = {
      type: types[args[0]],
      value: (Number.isNaN(args[1]) || num <= 0) ? undefined : num
    };
    if (!validated.type) {
      if (args.length === 2 && Number.isInteger(args[0]) && Number.isInteger(args[0])) {
        const num2 = parseInt(args[0]);
        validated.type = 'offset';
        if (num2 <= 0 || num <= 0) validated.value = undefined;
        validated.value = num2 < num ? [num2, num - num2] : [num, num2 - num];
      } else {
        validated.type = 'search';
        let value = [];
        args.forEach((arg) => {
          let emojiID = arg.replace(/<a?:\w+:([\d]+)>/g, '\\$1');
          if (emojiID) value.push(emojiID);
        });
        validated.value = value;
      }
    }
    return validated;
  }
  query(){
    if (this.type === 'DESC' || this.type === 'ASC') return this.client.emojiDB.rank(this.value, this.type);
    if (this.type === '<' || this.type === '>') return this.client.emojiDB.threshold(this.value, this.type);
    if (this.type === 'offset') return this.client.emojiDB.rank(this.value[1], 'DESC', this.value[0]);
    if (this.type === 'search') return this.client.emojiDB.multipleSelect(this.value);
  }

  async run(){
    // UGLY method's way too long, also unreadable and i was the one who wrote it
    try {
      let event;
      let fields = [];
      if(this.value) {
        const res = await this.query();
        if (!res || !res.rows || res.rows.length < 1) event = 'none';
        else {
          event = 'success';
          fields = [];
          res.rows.forEach((row, index) => {
            fields.push({
              name: `${index + 1}) ${this.message.guild.emojis.cache.get(row.emojiid).name}`,
              value: row.uses + ' uses',
              inline: true
            })
          });
        }
      }
      else event = 'invalid';
      this.send(event, fields)
        .catch((err) => {
          this.client.handle(err, 'emojiStats send', this.message)
        })
    }
    catch (err) {
      this.client.handle(err, 'emojiStats prepare', this.message)
    }
  }

  async send(event, args){
    // UGLY no way around this size so just extract success
    const strings = require('../../src/strings.json').emojistats;
    if (event === 'error') this.client.handle(err, 'emojiStats', this.message);
    if (event === 'invalid') this.client.error(this.message.channel, strings[this.type].title, strings[this.type].desc);
    if (event === 'none') this.client.error(this.message.channel, strings.none.title, strings.none.desc);
    if (event === 'success') {
      const Discord = require('discord.js');
      let secondMessage;
      if (args.length > 25) {
        secondMessage = new Discord.MessageEmbed()
          .addFields(args.splice(25))
      }
      const embed = new Discord.MessageEmbed()
        .setTitle(strings.success.title)
        .addFields(args);
      if (secondMessage) {
        this.message.channel.send(embed).then(() => {
          this.message.channel.send(secondMessage)
        });
      } else this.message.channel.send(embed);
    }
  }
}

module.exports.conf = {
  guildOnly: true,
  aliases: ['es', 'emoji'],
  permLevel: 'Mod',
  args: 1,
};

module.exports.help = {
  name: 'emojistats',
  category: 'info',
  description: 'Displays usage statistics for emojis in the guild',
  usage: 'emojistats <top|bottom|more|less> <num>|<min> <max>|<emojis>',
  details: '<top|bottom|more|less> <num> => Whether to display the top/bottom <num> ranked emojis, or the emojis with more/less than <num> uses.\n<min> <max> => The minimum and maximum ranked emojis to display.\n<emojis> => Actual emojis to display their rank and usage.',
};
