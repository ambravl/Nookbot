module.exports.Passport = class Passport {
  constructor(info) {
    this.info = info;
    this.Canvas = require('canvas');
    this.Canvas.registerFont('./src/passport/Humming.otf', {family: 'Humming'});
    this.canvas = this.Canvas.createCanvas(1094, 626);
    this.ctx = this.canvas.getContext('2d');
    this.color = "#AAD022";
    this.coords = {
      island: [467, 216, false],
      islandIcon: [424, 212],
      fruit: [670, 216, true],
      fruitIcon: [626, 212],
      bio: [430, 150, true],
      role: [423, 279, false],
      characterName: [426, 353, false],
      sign: [413, 411],
      birthday: [462, 422, true],
      friendcode: [508, 520, true],
      icon: [97, 119]
    }
  }

  async background() {
    const bgMask = await this.Canvas.loadImage('./src/passport/bgMask.png');
    this.ctx.drawImage(bgMask, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-out";
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    const background = await this.Canvas.loadImage('./src/passport/bg.png');
    this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-out";
    const icon = await this.Canvas.loadImage(this.info.icon);
    this.ctx.drawImage(icon, this.coords.icon[0], this.coords.icon[1], 245, 245);
    this.ctx.restore();
  }

  async text(name) {
    this.ctx.fillStyle = this.coords[name][2] ? '#999073' : '#59440b';
    this.ctx.font = name === 'characterName' ? '32px "Humming"' : '24px "Humming"';
    this.ctx.fillText(this.info[name], this.coords[name][0], this.coords[name][1], 480);
  }

  async islandInfo() {
    this.ctx.fillStyle = '#59440b';
    this.ctx.font = '24px "Humming"';
    this.ctx.fillText(this.info.island, this.coords.island[0], this.coords.island[0]);
    this.ctx.fillStyle = "#999073";
    const x = this.info.island[0] + this.ctx.measureText(this.info.island).width + 77;
    this.ctx.fillText(this.info.fruit, x, this.coords.island[0])
  }

  async name() {
    this.ctx.fillStyle = '#59440b';
    this.ctx.font = '32px "Humming"';
    this.ctx.fillText(this.info.characterName, 426, 353);
  }

  async draw() {
    await this.background();
    await this.islandInfo();
    await this.name();
    await this.text('bio');
    await this.text('characterName');
    await this.text('friendcode');
    await this.text('role');
    return this.canvas.toBuffer();
  }
};

