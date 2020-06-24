module.exports.Passport = class Passport {
  /**
   * @param {Object} info - an object containing the user's information
   * @param {string} info.icon - url to the user's avatar
   * @param {string} info.username - the user's display name
   * @param {string} info.island - the name of the user's island
   * @param {string} info.fruit - the user's native fruit
   * @param {string} info.friendcode - the user's friendcode
   * @param {string} info.switchName - the user's Switch profile name
   * @param {string} info.characterName - the user's in-game name
   * @param {int} info.rank - the user's ranking within the server
   * @param {int} info.userCount - the number of members in the server
   * @param {string} info.role - the name of the user's ranked role
   * @param {int} info.points - the amount of points the user has
   * @param {int} info.nextRole - the amount of points needed to get the next ranked role
   * @param {string} info.hemisphere // TODO
   * @param {string} info.bio - a short description the user has set
   * @param {string} info.joined - the day the user joined the server
   * @param {string} info.color - the color of the passport
   */
  constructor(info) {
    this.info = info;
    this.Canvas = require('canvas');
    this.Canvas.registerFont('./src/passport/Humming.otf', {family: 'Humming'});
    this.canvas = this.Canvas.createCanvas(1094, 626);
    this.ctx = this.canvas.getContext('2d');
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
    this.ctx.fillStyle = this.info.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.ctx.drawImage(await this.drawIcon(), 96, 118);
    const background = await this.Canvas.loadImage('./src/passport/bg.png');
    this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
  }

  async text(name) {
    this.ctx.fillStyle = this.coords[name][2] ? '#999073' : '#59440b';
    this.ctx.font = name === 'characterName' ? '32px "Humming"' : '24px "Humming"';
    this.ctx.fillText(this.info[name], this.coords[name][0], this.coords[name][1], 480);
  }

  async islandInfo() {
    this.ctx.fillStyle = '#59440b';
    this.ctx.font = '24px "Humming"';
    this.ctx.fillText(this.info.island, this.coords.island[0], this.coords.island[1]);
    this.ctx.fillStyle = "#999073";
    this.ctx.font = '24px "Humming"';
    const x = this.coords.island[0] + this.ctx.measureText(this.info.island).width + 77;
    this.ctx.fillText(this.info.fruit, x, this.coords.island[1]);
    const fruitIcon = await this.Canvas.loadImage(`./src/passport/${this.info.fruit}.png`);
    this.ctx.drawImage(fruitIcon, x - 40, this.coords.island[1] - 30, 40, 40);
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
  }

  async rank() {
    this.ctx.font = '24px "Humming"';
    this.ctx.fillStyle = "#999073";
    this.ctx.fillText("Ranked #", 457, 422);
    const red = Math.floor(this.info.rank * 150 / this.info.memberCount);
    const blue = Math.floor(this.info.rank * 108 / this.info.memberCount);
    this.ctx.fillStyle = `rgb(${red}, 139, ${blue})`;
    this.ctx.fillText(`${this.info.rank}`, 457 + this.ctx.measureText('Ranked #').width, 422);
    this.ctx.fillStyle = "#999073";
    this.ctx.fillText(` out of ${this.info.userCount}`, 457 + this.ctx.measureText(`Ranked #${this.info.rank}`).width, 422);
  }

  async role() {
    this.ctx.fillStyle = '#59440b';
    this.ctx.font = '24px "Humming"';
    this.ctx.fillText(this.info.role, 423, 279, 480);
    this.ctx.fillStyle = "#999073";
    this.ctx.font = '18px "Humming"';
    const x = this.ctx.measureText(this.info.role).width + 433;
    this.ctx.fillText(`${this.info.nextRole - this.info.points} points left to level up!`, x, 279);
  }

  async username() {
    this.ctx.font = '24px "Humming"';
    this.ctx.fillStyle = '#59440b';
    this.ctx.fillText(this.info.username, 83, 577);
    this.ctx.fillStyle = "#999073";
    this.ctx.fillText(` joined ${this.info.joined}`, 83 + this.ctx.measureText(this.info.username).width, 577)
  }

  async hemisphere() {
    this.ctx.fillStyle = "#99764d";
    this.ctx.font = '24px "Humming"';
    this.ctx.rotate(10 * 3.14 / 180);
    this.ctx.fillText(this.info.hemisphere, 125, 389);
  }

  async draw() {
    await this.background();
    await this.islandInfo();
    await this.name();
    await this.drawBio();
    await this.friendcode();
    await this.role();
    await this.username();
    await this.rank();
    return this.canvas.toBuffer();
  }
};

