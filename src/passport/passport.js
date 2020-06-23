module.exports.Passport = class Passport {
  constructor(info) {
    this.info = info;
    this.Canvas = require('canvas');
    this.canvas = this.Canvas.createCanvas(1000, 620);
    this.ctx = this.canvas.getContext('2d');
  }

  async color() {
    this.ctx.fillStyle = "#AFD528";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = 0.4;
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  async bottomBackground() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "hue";
    const background = await this.Canvas.loadImage('./src/passport/bottomPattern.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, "repeat-x");
    this.ctx.fillRect(0, 850, this.canvas.width, 150);
    this.ctx.restore();
  }

  async topBackground() {
    const background = await this.Canvas.loadImage('./src/passport/topPattern.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, "repeat");
    this.ctx.fillRect(0, 0, this.canvas.width, 130);
  }

  async middleBackground() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "darken";
    this.ctx.globalAlpha = 0.1;
    const background = await this.Canvas.loadImage('./src/passport/middlePattern.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, "repeat");
    this.ctx.fillRect(0, 130, this.canvas.width, 340)
    this.ctx.restore();
  }

  async draw() {
    await this.color();
    await this.bottomBackground();
    await this.topBackground();
    await this.middleBackground();
    return this.canvas.toBuffer();
  }
}

