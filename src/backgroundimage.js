/*
 * $Id: backgroundimage.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';

export default class BackgroundImage extends Shape {
  get shapeClassName() { return "BackgroundImage"; }

  constructor(desktop, src, width, height, xval, yval) {
    super(desktop);
    this.src = src;
    this.width = width;
    this.height = height;
    this.xval = xval;
    this.yval = yval;

    if (!this.src) {
      console.warn("BackgroundImage: no src was supplied. Giving up.");
      return;
    }

    // start preloading image when it was specified by string
    if (typeof(src) === "string") {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = src;
      img.onload = () => {
        this.bitmap = new createjs.Bitmap(img);
        this.init();
      };
    } else {
      this.bitmap = new createjs.Bitmap(src);
      this.init();
    }
  }

  get layer() {
    return Shape.BackgroundLayer;
  }

  init() {
    this.create();
    this.desktop.addShape(this);
    this.afterCreate();
    this.dispatchEvent("created");
    this.container.moveToBottom();
    this.desktop.update();
  }

  create() {
    const container = this.container;
    container.addChild(this.bitmap);

    if (this.width) {
      let bounds = this.bitmap.getBounds();
      if (bounds) {
        let sx = this.width / bounds.width;
        this.bitmap.scaleX = sx;
        this.bitmap.scaleY = sx;
      } else {
        console.warn("BackgroundImage:", `could not determine the bounds of "${this.src}"`);
      }
    } else if (this.height) {
      let bounds = this.bitmap.getBounds();
      if (bounds) {
        let sy = this.height / bounds.height;
        this.bitmap.scaleX = sy;
        this.bitmap.scaleY = sy;
      } else {
        console.warn("BackgroundImage:", `could not determine the bounds of "${this.src}"`);
      }
    }
    container.x = this.xval;
    container.y = this.yval;
  }

  focus() {
    // noop
  }

  blur() {
    // noop
  }
}
