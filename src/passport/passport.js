module.exports.Passport = class Passport {
  async constructor(info) {
    this.info = info;
    const Canvas = require('canvas');
    this.canvas = Canvas.createCanvas(1000, 620);
    this.ctx = this.canvas.getContext('2d');


    this.placeholderBG = await Canvas.loadImage('./src/passport/placeholder.png');
    this.bottomBG = await Canvas.loadImage('./src/passport/bottomPattern.png');
    this.topBG = await Canvas.loadImage('./src/passport/topPattern.png');
    this.middleBG = await Canvas.loadImage('./src/middlePattern.png');
  }

  async placeholder() {
    this.ctx.drawImage(this.placeholderBG, 0, 0, this.canvas.width, this.canvas.height);
  }

  async bottomBackground() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-over";
    this.ctx.fillStyle = this.ctx.createPattern(this.bottomBG, "repeat-x");
    this.ctx.fillRect(0, 850, this.canvas.width, 150);
    this.ctx.restore();
  }

  async topBackground() {
    this.ctx.fillStyle = this.ctx.createPattern(this.topBG, "repeat");
    this.ctx.fillRect(0, 0, this.canvas.width, 130);
  }

  async middleBackground() {
    this.ctx.fillStyle = this.ctx.createPattern(this.middleBG, "repeat");
    this.ctx.fillRect(0, 130, this.canvas.width, 720)
  }

  async draw() {
    await this.placeholder();
    await this.bottomBackground();
    await this.topBackground();
    await this.middleBackground();
    return this.canvas.toBuffer();
  }
}

