/*
 * $Id: arrowconnection.js 47659 2019-04-10 15:56:50Z robertj $
 */

import Shape from './shape';
import Arrow from './arrow'; // eslint-disable-line

export default class ArrowConnection extends Shape {
  get shapeClassName() { return "ArrowConnection"; }

  constructor(desktop) {
    super(desktop);
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  init() {
    this.desktop.addShape(this);
  }

  /**
   * Add the specified Arrow object to this instance. Fluent.
   *
   * @param {Arrow} arrow: the arrow to add.
   */
  addArrow(arrow) {
    this.arrow = arrow;
    this.container.addChild(arrow.container);
    this._connect();
    return this;
  }

  /**
   * Adds the specified Shape to this instance. Fluent.
   *
   * @param {Shape} shape: the shape to add.
   * @param {boolean} rotate: whether to allow rotation. Defaults to false.
   * @param {number} offset: the rotation offset. Defaults to 0.
   */
  addShape(shape, rotate = false, offset = 0) {
    this.shape = shape;
    this.container.addChild(shape.container);
    this.rotate = rotate;
    this.rotationOffset = offset;
    this._connect();
    return this;
  }

  _connect() {
    if (!(this.arrow && this.shape)) return;

    this.shape.on("moved", () => this._shapeMoved());
    this.arrow.on("moved", () => this._arrowMoved());
    this.shape.on("deleted", () => this.remove());
    this.arrow.on("deleted", () => this.remove());

    if (this.rotate) {
      this.shape.container.rotation = this.rotationOffset;
      this.shape.rotatable = false;
    }

    // trigger once
    this._shapeMoved();
    this.dispatchEvent("created");
  }

  _shapeMoved() {
    const shapeContainer = this.shape.container;
    let pt = shapeContainer.positionToLocal(this.arrow.a1);

    // FIXME: we're detecting "draggables" by their cheight property.
    if (shapeContainer.cheight) {
      this.arrow.a1.x = pt.x;
      this.arrow.a1.y = pt.y;
    } else {
      this.arrow.a1.x = pt.x + shapeContainer.cwidth / 2;
      this.arrow.a1.y = pt.y + 30;
    }

    this.arrow.redraw();
    this._rotate();
    this.desktop.update();
  }

  _arrowMoved() {
    const shapeContainer = this.shape.container;
    const pt = this.arrow.a1.positionToLocal(shapeContainer);

    // FIXME: we're detecting "draggables" by their cheight property.
    if (shapeContainer.cheight) {
      shapeContainer.x = pt.x;
      shapeContainer.y = pt.y;
    } else {
      shapeContainer.x = pt.x - shapeContainer.cwidth / 2;
      shapeContainer.y = pt.y - 30;
    }
    if (this.arrow.adjustable) {
      this.desktop.deleter.visible = false;
    }

    this._rotate();
    shapeContainer.moveToTop();
    this.desktop.update();
    }

  _rotate() {
    if (this.rotate)
      this.shape.container.rotation = this.arrow.rotationValue + this.rotationOffset;
  }

  remove() {
    super.remove();
    if (this.arrow) this.arrow.remove();
    if (this.shape) this.shape.remove();
  }

  persist() {
    super.persist();
    if (!(this.arrow && this.shape)) return;
    this.arrow.persist();
    this.shape.persist();
  }
}
