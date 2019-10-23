/*
 * $Id: pieconnection.js 42460 2017-07-31 12:10:36Z robertj $
 */

import Shape from './shape';
import Pie from './pie'; // eslint-disable-line

export default class PieConnection extends Shape {
  get shapeClassName() { return "PieConnection"; }

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
   * Add the specified pie object to this instance. Fluent.
   *
   * @param {Pie} pie: the pie to add.
   */
  addPie(pie) {
    this.pie = pie;
    this.container.addChild(pie.container);
    this._connect();
    return this;
  }

  /**
   * Adds the specified Shape to this instance. Fluent.
   *
   * @param {Shape} shape: the shape to add.
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
    if (!(this.pie && this.shape)) return;

    this.shape.on("moved", () => this._shapeMoved());
    this.shape.on("deleted", () => {
      this.pie.remove();
      this.remove();
    });

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
    const pieContainer = this.pie.container;

    let pt = shapeContainer.positionToLocal(pieContainer);

    if (shapeContainer.cheight) {
      pieContainer.x = shapeContainer.x + shapeContainer.cwidth / 2 + pieContainer.cwidth / 2 + 5;
      pieContainer.y = shapeContainer.y + shapeContainer.cheight / 2 - pieContainer.cheight / 2;
    } else {
      pieContainer.x = pt.x + shapeContainer.cwidth +  pieContainer.cwidth / 2 + 5;
      pieContainer.y = pt.y + pieContainer.cheight;
    }

    pieContainer.moveToTop();
    this.desktop.update();
  }

  remove() {
    super.remove();
    if (this.pie) this.pie.remove();
    if (this.shape) this.shape.remove();
  }

  persist() {
    super.persist();
    if (!(this.pie && this.shape)) return;
    this.pie.persist();
    this.shape.persist();
  }
}
