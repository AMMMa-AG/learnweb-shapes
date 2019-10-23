/*
 * $Id: stacklayout.js 42423 2017-07-28 23:14:04Z robertj $
 */

import Shape from "../shape"; // eslint-disable-line no-unused-vars
import BaseLayout from './baselayout';

export default class StackLayout extends BaseLayout {
  /**
   * Creates a stack layout for the specified target (shape).
   *
   * @param {Shape} target: the target of the layout.
   * @param {string} alignment: the initial alignment (a combination of
   * "horizontal" (or "h") and "vertical" (or "v")
   *  with "top", "bottom", "vcenter", "right", "left", "hcenter")
   * @param {number} padding: optional padding between elements.
   * @param {boolean} attract: whether to "attract" sources.
   */
  constructor(target, { alignment = "", padding = 0, attract = true} = {}) {
    super(target, arguments[1]);
    this.alignment = alignment;
    this.padding = padding;
    this.attract = attract;
    this.endmoveHandlers = new Map();
  }

  /**
   * Gets the alignment as a string.
   */
  get alignment() {
    return this._alignment.join(" ");
  }

  /**
   * Sets the alignment from a string.
   */
  set alignment(value) {
    this._alignment = (value || "").split(/\s+/);

    this.alignTop = this._alignment.includes("top");
    this.alignBottom = this._alignment.includes("bottom");
    this.alignVCenter = this._alignment.includes("vcenter");

    if (!(this.alignTop || this.alignBottom || this.alignVCenter))
      this.alignTop = true;

    this.alignLeft = this._alignment.includes("left");
    this.alignRight = this._alignment.includes("right");
    this.alignHCenter = this._alignment.includes("hcenter");

    if (!(this.alignLeft || this.alignRight || this.alignHCenter))
      this.alignLeft = true;

    this.horizontal = this._alignment.includes("horizontal") ||
      this._alignment.includes("h")
    this.vertical = this._alignment.includes("vertical") ||
      this._alignment.includes("v")

    if (this.horizontal && this.vertical)
      this.vertical = false;

    if (!(this.horizontal || this.vertical))
      this.horizontal = true;
  }

  afterAdd(shape) {
    if (this.attract) {
      this.endmoveHandlers.set(shape, shape.container.on("endmove", () => {
        shape.created.then(() => this.align());
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
    return this.created.then(() => {
      if (this.horizontal)
        return this.alignHorizontally();
      else if (this.vertical)
        return this.alignVertically();
    });
  }

  /**
   * Aligns the shapes vertically.
   *
   * @private
   */
  alignVertically() {
    let targetBounds = this.target.getBounds();

    let shapesHeight = 0;
    this.shapes.forEach((shape, index) => {
      let bounds = shape.getBounds();
      shapesHeight += bounds.height + this.padding;
    });

    let y;

    if (this.alignVCenter) {
      y = this.target.container.y + (targetBounds.height - shapesHeight) / 2;
    } else if (this.alignTop) {
      y = this.target.container.y + this.padding;
    } else if (this.alignBottom) {
      y = this.target.container.y + (targetBounds.height - shapesHeight);
    }

    let promises = [];
    let currentHeight = 0;
    this.shapes.forEach((shape, index) => {
      let bounds = shape.getBounds();
      let x;

      if (this.alignHCenter) {
        x = this.target.container.x + (targetBounds.width - bounds.width) / 2;
      } else if (this.alignLeft) {
        x = this.target.container.x + this.padding;
      } else if (this.alignRight) {
        x = this.target.container.x + targetBounds.width - bounds.width - this.padding;
      }
      promises.push(shape.moveAnimated(x, y + currentHeight, this.animationSpeed));
      currentHeight += bounds.height + this.padding;
    });

    return Promise.all(promises);
  }

  /**
   * Aligns the shapes horizontally.
   *
   * @private
   */
  alignHorizontally() {
    let targetBounds = this.target.getBounds();

    let shapesWidth = 0;
    this.shapes.forEach((shape, index) => {
      let bounds = shape.getBounds();
      shapesWidth += bounds.width + this.padding;
    });

    let x;

    if (this.alignLeft) {
      x = this.target.container.x + this.padding;
    } else if (this.alignHCenter) {
      x = this.target.container.x + (targetBounds.width - shapesWidth) / 2;
    } else if (this.alignRight) {
      x = this.target.container.x + (targetBounds.width - shapesWidth);
    }

    let promises = [];
    let currentWidth = 0;
    this.shapes.forEach((shape, index) => {
      let bounds = shape.getBounds();
      let y = this.target.container.y + this.padding;

      if (this.alignVCenter) {
        y = this.target.container.y + (targetBounds.height - bounds.height) / 2;
      } else if (this.alignTop) {
        y = this.target.container.y + this.padding;
      } else if (this.alignBottom) {
        y = this.target.container.y + (targetBounds.height - bounds.height - this.padding);
      }

      promises.push(shape.moveAnimated(x + currentWidth, y, this.animationSpeed));
      currentWidth += bounds.width + this.padding;
    });

    return Promise.all(promises);
  }
}
