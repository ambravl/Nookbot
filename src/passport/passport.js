module.exports.Passport = class Passport {
  constructor(info) {
    this.info = info;
    this.Canvas = require('canvas');
    this.canvas = this.Canvas.createCanvas(1094, 626);
    this.ctx = this.canvas.getContext('2d');
    this.color = "#AAD022";
  }

  async background() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-in";
    const background = await this.Canvas.loadImage('./src/passport/bg.png');
    this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  async icon() {
    const iconBoundary = await this.Canvas.loadImage('./src/avvy.png');
    this.ctx.drawImage(iconBoundary, 97, 119);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-in";
    const icon = await this.Canvas.loadImage(this.info.icon);
    this.ctx.drawImage(icon, 97, 119, 246, 249);
    this.ctx.restore();
  }

  async draw() {
    await this.background();
    await this.icon();
    return this.canvas.toBuffer();
  }
};

