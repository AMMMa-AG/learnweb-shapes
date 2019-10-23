export default class PositionHelper {
  /**
   * Creates a new position dispenser starting at x, y, and which
   * increments the positions by @param offset.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} offset
   */
  constructor(x, y, offset) {
    this.x = x;
    this.y = y;
    this.offset = offset;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /**
   * Gets a new x value and increments the offset.
   */
  getX() {
    const value = this.x + this.offsetX;
    this.offsetX += this.offset;
    return value;
  }

  /**
   * Gets a new y value and increments the offset.
   */
  getY() {
    const value = this.y + this.offsetY;
    this.offsetY += this.offset;
    return value;
  }

  /**
   * Gets a new position object and increments the offsets.
   */
  pos() {
    return {
      x: this.getX(),
      y: this.getX()
    }
  }
}
