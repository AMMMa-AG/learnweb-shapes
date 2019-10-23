/*
 * $Id: circle.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import SimpleShape from './simpleshape';

export default class Circle extends SimpleShape {
  get shapeClassName() { return "Circle"; }

  constructor(desktop, width, xval, yval, color, backgroundColor, backgroundAlpha, strokeWidth, deletable, resizable, resizeProportional, rotatable, regPoint, pinable, adjustable) {
    super(desktop);
    this.conwidth = this.load("w", width);
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.color = this.load("c", color);
    this.backgroundColor = this.load("bc", backgroundColor);
    this.backgroundAlpha = this.load("ba", backgroundAlpha);
    this.strokeWidth = this.load("sw", strokeWidth);
    this.deletable = deletable;
    this.resizable = resizable;
    this.resizeProportional = resizeProportional;
    this.rotatable = rotatable;
    this.regPoint = regPoint;
    this.pinable = pinable;
    this.adjustable = adjustable;
    this.init();
  }

  create() {
    const container = this.container;

    let circleInner = new createjs.Shape();
    circleInner.graphics
      .beginFill(this.backgroundColor)
      .drawEllipse(0, 0, this.conwidth, this.conwidth);
    circleInner.alpha = this.backgroundAlpha;

    let circleOutline = new createjs.Shape();
    circleOutline.graphics
      .beginStroke(this.color)
      .setStrokeStyle(this.strokeWidth)
      .drawEllipse(0, 0, this.conwidth, this.conwidth);

    container.addChild(circleInner);
    container.addChild(circleOutline);

    container.cwidth = this.conwidth;
    container.cheight = this.load("h", this.conwidth);
    container.rotation = this.load("r", 0);

    if (this.regPoint == 1) {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }
    container.x = this.xval;
    container.y = this.yval;
  }

  update(newWidth, newHeight, outer, inner) {
    inner.graphics
      .beginFill(this.backgroundColor)
      .drawEllipse(0, 0, newWidth, newHeight);
    outer.graphics
      .drawEllipse(0, 0, newWidth, newHeight);
    this.container.cwidth = newWidth;
    this.container.cheight = newHeight;
  }

}
