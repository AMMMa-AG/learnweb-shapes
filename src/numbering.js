/*
 * $Id: numbering.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import SimpleShape from './simpleshape';

export default class Numbering extends SimpleShape {
  get shapeClassName() { return "Numbering"; }

  constructor(desktop, value, width, xval, yval, backgroundColor, backgroundAlpha, deletable, resizable, resizeProportional, rotatable, regPoint) {
    super(desktop);
    this.value = value;
    this.conwidth = this.load("w", width);
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.backgroundColor = backgroundColor;
    this.backgroundAlpha = backgroundAlpha;
    this.deletable = deletable;
    this.resizable = resizable;
    this.resizeProportional = resizeProportional;
    this.rotatable = rotatable;
    this.regPoint = regPoint;
    this.pinable = false;
    this.adjustable = false;
    this.init();
  }

  /**
   * Overrides deleter's position so it doesn't hide too much of the number.
   */
  get deleterPos() {
    const container = this.container;

    return {
      x: container.x - 10,
      y: container.y - 10
    };
  }

  create() {
    const container = this.container;
    let rectInner = new createjs.Shape();
    rectInner.graphics
      .beginFill(this.backgroundColor)
      .drawRect(0, 0, this.conwidth, this.conwidth);
    rectInner.alpha = this.backgroundAlpha;


   let newSize = this.conwidth*0.7 +  'px';
   let text = new createjs.Text("", newSize + " Arial", "#ffffff");
   text.text = this.value.toString();

  if(this.value < 10){
      text.x = this.conwidth*0.3;
  }else{
     text.x = this.conwidth*0.1;
  }


   text.y = this.conwidth*0.1;

    container.addChild(rectInner);
    container.addChild(text);

    container.cwidth = this.conwidth;
    container.cheight = this.load("h", this.conwidth);
    container.value = this.value;

    if (this.regPoint == 1) {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }

    container.x = this.xval;
    container.y = this.yval;
    container.rotation = this.load("r", 0);
  }

  resizeBy(evt) {
    const inner = new createjs.Shape();
    const container = this.container;

    const alpha = this.backgroundAlpha;

    container.removeAllChildren();

    inner.alpha = alpha;

    if (this.regPoint == 0) {
      container.regX = 0;
      container.regY = 0;
    } else {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }

    const angle = -container.rotation * Math.PI / 180;
    let px = Math.cos(angle) * (evt.x) - Math.sin(angle) * (evt.y);
    let py = Math.sin(angle) * (evt.x) + Math.cos(angle) * (evt.y);

    let distanceX = container.cwidth + px;
    let distanceY = container.cheight + py;

    if (this.resizeProportional == true) {
      if (distanceX > distanceY) {
        this.inc(distanceX, distanceX, inner);
      }
      else {
        this.inc(distanceY, distanceY, inner);
      }
    }
    else {
      this.inc(distanceX, distanceY, inner);
    }
  }

inc(newWidth, newHeight, inner) {
    inner.graphics
      .beginFill(this.backgroundColor)
      .drawRect(0, 0, newWidth, newHeight);

  let newSize = newWidth* 0.7 +  'px';
  let text = new createjs.Text("", newSize + " Arial", "#ffffff");

  text.text = this.container.value.toString();

  if(this.container.value < 10){
    text.x = newWidth*0.3;
  }else{
     text.x = newWidth*0.1;
  }

  text.y = newWidth*0.1;
  this.container.addChild(inner);
  this.container.addChild(text);

  this.container.cwidth = newWidth;
  this.container.cheight = newHeight;
  }
}
