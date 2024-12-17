class Item {
  constructor(ctx, id, x, y, width, height, image, scoreInstance) {
    this.ctx = ctx;
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
    this.isVisible = false;
    this.scoreInstance = scoreInstance;
  }

  update(speed, gameSpeed, deltaTime, scaleRatio) {
    this.isVisible = this.scoreInstance.isItemAvailableInCurrentStage(this.id);

    if (this.isVisible) {
      this.x -= speed * gameSpeed * deltaTime * scaleRatio;
    }
  }

  draw() {
    if (this.isVisible) {
      this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  collideWith = (sprite) => {
    if (!this.isVisible) return false;

    const adjustBy = 1.4;
    const result =
      this.x < sprite.x + sprite.width / adjustBy &&
      this.x + this.width / adjustBy > sprite.x &&
      this.y < sprite.y + sprite.height / adjustBy &&
      this.y + this.height / adjustBy > sprite.y;

    if (result) {
      this.width = 0;
      this.height = 0;
      this.x = 0;
      this.y = 0;
      this.isVisible = false;
    }

    return result;
  };
}

export default Item;
