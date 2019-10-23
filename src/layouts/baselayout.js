/*
 * $Id: baselayout.js 42425 2017-07-29 00:50:45Z robertj $
 */

import Shape from "../shape"; // eslint-disable-line no-unused-vars

export default class BaseLayout {
  /**
   * Creates a layout for the specified target (shape).
   *
   * @param {Shape} target: the target of the layout.
   * @param {number} animationSpeed: the default animation speed.
   */
  constructor(target, { animationSpeed = 100 } = {}) {
    this.target = target;
    this.animationSpeed = animationSpeed;
    this.shapes = [];
    this.added = new Set();
  }

  /**
   * Adds a shape to the layout.
   *
   * @param {Shape} shape
   * @param {boolean} align: whether to align the layout.
   * @returns {Promise}
   */
  add(shape, align = false) {
    if (!this.contains(shape)) {
      this.shapes.push(shape);
      this.added.add(shape);
      this.afterAdd(shape);
      if (align)
        return this.align();
    }
    return Promise.resolve();
  }

  /**
   * Invoked after an add() operation.
   * @private
   * @param {Shape} shape
   */
  afterAdd(shape) {
  }

  /**
   * Removes the shape from the layout.
   *
   * @param {Shape} shape
   * @param {boolean} align: whether to align the layout.
   * @returns {Promise}
   */
  remove(shape, align = false) {
    if (this.contains(shape)) {
      this.added.delete(shape);
      let shapes = this.shapes.filter((value) => value != shape);
      this.shapes = shapes;
      this.afterRemove(shape);
      if (align)
        return this.align();
    }
    return Promise.resolve();
  }

  /**
   * Invoked after a remove() operation.
   * @private
   * @param {Shape} shape
   */
  afterRemove(shape) {
  }

  /**
   * Whether the specified shape is part of the layout.
   *
   * @param {Shape} shape
   * @returns {boolean}
   */
  contains(shape) {
    return this.added.has(shape);
  }

  /**
   * Aligns the shapes to the layout.
   * Must be overriden by subclasses.
   *
   * @returns {Promise} which resolves after all shapes were aligned.
   */
  align() {
    return null;
  }

  /**
   * Gets the promise which resolves when all shapes and the
   * target are created.
   *
   * @returns {Promise}
   */
  get created() {
    return this.target.created
      .then(() => Promise.all(this.shapes.map((shape) => shape.created)));
  }
}
