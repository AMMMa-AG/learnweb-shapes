/*
 * $Id: backgroundcontainer.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';

export default class BackgroundContainer extends Shape {
  get shapeClassName() { return "BackgroundContainer"; }

  constructor(desktop, xval, yval, width, height, color) {
    super(desktop);
    this.xval = xval;
    this.yval = yval;
    this.width = width;
    this.height = height;
    this.color = color;
    this.init();
  }

  get layer() {
    return Shape.BackgroundLayer;
  }

  create() {
    const container = this.container;
    container.x = this.xval;
    container.y = this.yval;
    container.cwidth = this.width;
    container.cheight = this.height;
    let shape = new createjs.Shape();
    shape.graphics
      .beginFill(this.color)
      .drawRect(0, 0, this.width, this.height);
    container.addChild(shape);
    container.setBounds(0, 0, this.width, this.height);
  }

  focus() { }
  blur() { }
}
