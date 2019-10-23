/*
 * $Id: nulllayout.js 42423 2017-07-28 23:14:04Z robertj $
 */

import Shape from "../shape"; // eslint-disable-line no-unused-vars
import BaseLayout from './baselayout';

export default class NullLayout extends BaseLayout {
  /**
   * Creates an unlayouted layout ;) which keeps track of the
   * shapes position, so we can move them around and attract
   * them back to their original positions.
   *
   * @param {Shape} target: the target of the layout.
   * @param {Object} options: additional options. See BaseLayout.
   */
  constructor(target, options) {
    super(target, options);
    this.shapePos = new Map();
    this.beginmoveHandlers = new Map();
  }

  afterAdd(shape) {
    shape.created.then(() => {
      this.beginmoveHandlers.set(shape, shape.container.on("beginmove", () => {
        this.shapePos.set(shape, shape.location);
      }));
    });
  }

  afterRemove(shape) {
    shape.container.off("beginmove", this.beginmoveHandlers.get(shape));
  }

  /**
   * Aligns the shapes to the layout.
   *
   * @returns {Promise} which resolves after all shapes were aligned.
   */
  align() {
    return this.created.then(() => this._align());
  }

  /**
   * Aligns the shapes to the layout.
   * @private
   * @returns {Promise} which resolves after all shapes were aligned.
   */
  _align() {
    return Promise.all(this.shapes.map((shape) => {
      let pos = this.shapePos.get(shape);
      if (pos)
        return shape.moveAnimated(pos.x, pos.y, this.animationSpeed);
      else
        return Promise.resolve();
    }));
  }
}
