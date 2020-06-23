module.exports.Passport = class Passport {
  constructor(info) {
    this.info = info;
    this.Canvas = require('canvas');
    this.canvas = this.Canvas.createCanvas(1094, 626);
    this.ctx = this.canvas.getContext('2d');
    this.color = "#AFD528";
  }

  async background() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-in";
    const background = await this.Canvas.loadImage('./src/passport/bg.png');
    this.ctx.fillStyle = this.ctx.createPattern(background, 'no-repeat');
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  async draw() {
    await this.background();
    return this.canvas.toBuffer();
  }
}

