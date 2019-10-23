/*
 * $Id: crescendo.js $
 */

import { createjs } from 'EaselJS';
import SimpleShape from './simpleshape';

export default class Crescendo extends SimpleShape {
  get shapeClassName() { return "Crescendo"; }

  constructor(desktop, width, height, xval, yval, color, backgroundColor, strokeWidth, deletable, adjustable) {
    super(desktop);
    this.width = this.load("w", width);
    this.height = this.load("h", height);
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.color = color;
    this.backgroundColor = backgroundColor;
    this.backgroundAlpha = 0.8;
    this.strokeWidth = strokeWidth;
    this.deletable = deletable;
    this.resizable = true;
    this.rotatable = false;
    this.regPoint = 0;
    this.pinable = false;
    this.adjustable = false;
    this.init();
  }

    get deleterPos() {

    let point = {};
    point.x = this.container.x + this.container.cwidth;
    point.y = this.container.y;
    return point;
  }

   get expanderPos() {

    let point = {};
    point.x = this.container.x + this.container.cwidth;
    point.y = this.container.y + this.container.cheight;
    return point;
  }



  create() {
    const container = this.container;

    let triInner = new createjs.Shape();
    triInner.graphics
      .beginFill(this.backgroundColor)
      .moveTo(0, this.height/2)
      .lineTo(this.width, this.height)
      .lineTo(this.width, 0)
      .lineTo(0, this.height/2)
      .endStroke();
    triInner.alpha = this.backgroundAlpha;

    let triOutline = new createjs.Shape();
    triOutline.graphics
      .beginStroke(this.color)
      .setStrokeStyle(this.strokeWidth)
      .moveTo(0, this.height/2)
      .lineTo(this.width, this.height)
      .lineTo(this.width, 0)
      .lineTo(0, this.height/2)
      .lineTo(this.width, this.height)
      .endStroke();

    container.addChild(triInner);
    container.addChild(triOutline);

    container.cwidth = this.width;
    container.cheight = this.load("h", this.height);

    if (this.regPoint == 1) {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }

    container.x = this.xval;
    container.y = this.yval;
    container.rotation = this.load("r", 0);
  }

  update(newWidth, newHeight, outer, inner) {
    inner.graphics
      .beginFill(this.backgroundColor)
      .moveTo(0, newHeight/2)
      .lineTo(newWidth, newHeight)
      .lineTo(newWidth, 0)
      .lineTo(0, newHeight/2)
      .lineTo(newWidth, newHeight)
      .endStroke();
    outer.graphics
      .moveTo(0, newHeight/2)
      .lineTo(newWidth, newHeight)
      .lineTo(newWidth, 0)
      .lineTo(0, newHeight/2)
      .lineTo(newWidth, newHeight)
      .endStroke();

    this.container.cwidth = newWidth;
  }
}
