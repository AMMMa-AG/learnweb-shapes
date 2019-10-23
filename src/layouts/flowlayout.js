/*
 * $Id: flowlayout.js 42423 2017-07-28 23:14:04Z robertj $
 */

import Shape from "../shape"; // eslint-disable-line no-unused-vars
import BaseLayout from './baselayout';

export default class FlowLayout extends BaseLayout {
  /**
   * Creates a flow layout for the specified target (shape).
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
  }

  afterAdd(shape) {
    if (this.attract) {
      this.endmoveHandlers.set(shape, shape.container.on("endmove", () => {
        shape.created.then(() => this._align());
      }));
    }
  }

  afterRemove(shape) {
    if (this.attract)
      shape.container.off("endmove", this.endmoveHandlers.get(shape));
  }

  /**
   * Aligns the shapes to the layout.
   *
   * @returns {Promise} which resolves after all shapes were aligned.
   */
  align() {
    // we must align twice: first time w/out considering the size
    // of the shape after resizeTo(), and a second time with.
    return this.created
      .then(() => this._align())
      .then(() => this._align());
  }

  /**
   * Aligns the shapes to the layout.
   * @private
   */
  _align() {
    let targetBounds = this.target.getBounds();
    let cellWidth = (targetBounds.width - this.padding - (this.columns * this.padding)) / this.columns;

    return Promise.all(this.shapes.map((shape, index) => {
      let row = Math.floor(index / this.columns);
      let col = index % this.columns;
      let bounds = shape.getBounds();

      let x = this.target.container.x + this.padding + (cellWidth + this.padding) * col;
      let y = this.target.container.y + this.padding + (bounds.height + this.padding) * row;

      // FIXME: this only works with shapes that support proportional resize
      shape.resizeTo(cellWidth, 0);
      return shape.moveAnimated(x, y, this.animationSpeed);
    }));
  }
}
