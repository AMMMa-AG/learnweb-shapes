/*
 * $Id: gridlayout.js 42426 2017-07-29 01:22:52Z robertj $
 */

import Shape from "../shape"; // eslint-disable-line no-unused-vars
import BaseLayout from './baselayout';

export default class GridLayout extends BaseLayout {
  /**
   * Creates a grid layout for the specified target (shape).
   *
   * @param {Shape} target: the target of the layout.
   * @param {number} padding: optional padding between elements.
   * @param {boolean} attract: whether to "attract" sources.
   */
  constructor(target, { columns = 1, padding = 0, attract = true} = {}) {
    super(target, arguments[1]);
    this.columns = columns;
    this.padding = padding;
    this.attract = attract;
    this.endmoveHandlers = new Map();
    this.aligned = false;
    this.bounds = new Map();
    this.removed = new Set();
  }

  /**
   * See BaseShape.add().
   *
   * @param {Shape} shape
   * @param {boolean} [align=false]
   * @returns {Promise}
   */
  add(shape, align = false) {
    if (this.aligned) {
      this.removed.delete(shape);
      let bounds = this.bounds.get(shape);
      if (bounds) {
        shape.resizeTo(bounds.width, bounds.height);
        return shape.moveAnimated(bounds.x, bounds.y, this.animationSpeed);
      }
      return Promise.resolve();
    }
    return super.add(shape, align);
  }

  afterAdd(shape) {
    if (this.attract) {
      this.endmoveHandlers.set(shape, shape.container.on("endmove", () => {
        shape.created.then(() => this._align());
      }));
    }
  }

  /**
   * See BaseShape.remove().
   *
   * @param {Shape} shape
   * @param {boolean} [align=false]
   * @returns {Promise}
   */
  remove(shape, align = false) {
    if (this.aligned) {
      this.removed.add(shape);
      return Promise.resolve();
    }
    return super.remove(shape, align);
  }

  afterRemove(shape) {
    if (this.attract)
      shape.container.off("endmove", this.endmoveHandlers.get(shape));
  }

  contains(shape) {
    return this.bounds.has(shape) && !this.removed.has(shape);
  }

  /**
   * Aligns the shapes to the layout.
   *
   * @returns {Promise} which resolves after all shapes were aligned.
   */
  align() {
    if (!this.aligned) {
      this.aligned = true;
      // we must align twice: first time w/out considering the size
      // of the shape after resizeTo(), and a second time with.
      return this.created
        .then(() => this._align())
        .then(() => this._align());
    }

    return this.created.then(() => this._align());
  }

  /**
   * Aligns the shapes to the layout.
   * @private
   */
  _align() {
    let targetBounds = this.target.getBounds();
    let cellWidth = (targetBounds.width - this.padding - (this.columns * this.padding)) / this.columns;

    return Promise.all(this.shapes.map((shape, index) => {
      if (this.removed.has(shape))
        return Promise.resolve();

      let row = Math.floor(index / this.columns);
      let col = index % this.columns;
      let bounds = shape.getBounds();

      let x = this.target.container.x + this.padding + (cellWidth + this.padding) * col;
      let y = this.target.container.y + this.padding + (bounds.height + this.padding) * row;

      // FIXME: this only works with shapes that support proportional resize
      shape.resizeTo(cellWidth, 0);

      // store bounds
      bounds = shape.getBounds();
      bounds.x = x;
      bounds.y = y;
      this.bounds.set(shape, bounds);

      return shape.moveAnimated(x, y, this.animationSpeed);
    }));
  }
}
