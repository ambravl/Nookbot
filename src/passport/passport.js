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
      role: [423, 281, false],
      characterName: [426, 348, false],
      sign: [413, 411],
      birthday: [462, 422, true],
      friendcode: [508, 520, true],
      icon: [97, 119]
    }
  }

  async background() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-in";
    const bgMask = await this.Canvas.loadImage('./src/passport/bgMask.png');
    this.ctx.drawImage(bgMask, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    const background = await this.Canvas.loadImage('./src/passport/bg.png');
    this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
  }

  async icon() {
    const iconBoundary = await this.Canvas.loadImage('./src/passport/avvy.png');
    this.ctx.drawImage(iconBoundary, this.coords.icon[0], this.coords.icon[1]);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-atop";
    const icon = await this.Canvas.loadImage(this.info.icon);
    this.ctx.drawImage(icon, this.coords.icon[0], this.coords.icon[1], 245, 245);
    this.ctx.restore();
  }

  async text(name) {
    this.ctx.fillStyle = this.coords[name][2] ? '#59440b' : '#59440b';
    this.ctx.font = name === 'characterName' ? '35px "Humming"' : '25px "Humming"';
    this.ctx.fillText(this.info[name], this.coords[name][0], this.coords[name][1], 480);
  }

  async draw() {
    await this.background();
    await this.icon();
    await this.text('island');
    await this.text('bio');
    await this.text('characterName');
    await this.text('fruit');
    await this.text('friendcode');
    await this.text('role');
    return this.canvas.toBuffer();
  }
};

