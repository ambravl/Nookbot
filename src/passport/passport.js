module.exports.Passport = class Passport {
  constructor(info) {
    this.info = info;
    this.Canvas = require('canvas');
    this.canvas = this.Canvas.createCanvas(500, 310);
    this.ctx = this.canvas.getContext('2d');
  }

  async placeholder() {
    const background = await this.Canvas.loadImage('./placeholder.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, "repeat-x");
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async bottomBackground() {
    const background = await this.Canvas.loadImage('./src/passport/bottomPattern.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, "repeat-x");
    this.ctx.fillRect(0, 235, this.canvas.width, 75);
  }

  async topBackground() {
    const background = await this.Canvas.loadImage('./src/passport/topPattern.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, "repeat-x");
    this.ctx.fillRect(0, 0, this.canvas.width, 70);
  }

  async draw() {
    await this.placeholder();
    await this.bottomBackground();
    await this.topBackground();
    return this.canvas.toBuffer();
  }
}

