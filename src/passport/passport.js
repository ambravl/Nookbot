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

  async drawIcon() {
    const canvas = this.Canvas.createCanvas(250, 250);
    const ctx = canvas.getContext("2d");
    const iconMask = await this.Canvas.loadImage('./src/passport/avvy.png');
    const icon = await this.Canvas.loadImage(this.info.icon);
    ctx.drawImage(iconMask, 0, 0, 250, 250);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(icon, 0, 0, 250, 250);
    return canvas;
  }

  async background() {
    const bgMask = await this.Canvas.loadImage('./src/passport/bgMask.png');
    this.ctx.drawImage(bgMask, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-out";
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.ctx.drawImage(await this.drawIcon(), 97, 119);
    const background = await this.Canvas.loadImage('./src/passport/bg.png');
    this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
  }

  async text(name) {
    this.ctx.fillStyle = this.coords[name][2] ? '#999073' : '#59440b';
    this.ctx.font = name === 'characterName' ? '32px "Humming"' : '24px "Humming"';
    this.ctx.fillText(this.info[name], this.coords[name][0], this.coords[name][1], 480);
  }

  async islandInfo() {
    // const islandIcon = this.Canvas.loadImage('./src/passport/islandName.png');
    // this.ctx.filter = 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(120deg)';
    // this.ctx.drawImage(islandIcon, 424, 212, 40, 40);
    this.ctx.fillStyle = '#59440b';
    this.ctx.font = '24px "Humming"';
    this.ctx.fillText(this.info.island, this.coords.island[0], this.coords.island[1]);
    this.ctx.fillStyle = "#999073";
    this.ctx.font = '24px "Humming"';
    const x = this.coords.island[0] + this.ctx.measureText(this.info.island).width + 77;
    this.ctx.fillText(this.info.fruit, x, this.coords.island[1])
  }

  async name() {
    this.ctx.fillStyle = '#59440b';
    this.ctx.font = '32px "Humming"';
    this.ctx.fillText(this.info.characterName, 426, 353);
  }

  async friendcode() {
    this.ctx.fillStyle = "#999073";
    this.ctx.font = '24px "Humming';
    const text = this.info.switchName + ' on ' + this.info.friendcode;
    const x = 716 - (this.ctx.measureText(text).width / 2);
    this.ctx.fillText(text, x, 520);
  }

  async drawBio() {
    this.ctx.font = '24px "Humming';
    const width = Math.min(480, this.ctx.measureText(this.info.bio).width) + 7;
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(255, 248, 221, 0.9)';
    this.ctx.moveTo(423, 105);
    this.ctx.lineTo(423 + width, 105);
    this.ctx.arc(423 + width, 137, 32, 1.5 * Math.PI, 0.5 * Math.PI);
    this.ctx.lineTo(423, 167);
    this.ctx.arc(423, 137, 31, 0.5 * Math.PI, 1.5 * Math.PI);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = "#999073";
    this.ctx.fillText(this.info.bio, 430, 147, 480);
    // this.ctx.filter = ""
  }

  async draw() {
    await this.background();
    await this.islandInfo();
    await this.name();
    await this.drawBio();
    await this.friendcode();
    await this.text('role');
    return this.canvas.toBuffer();
  }
};

