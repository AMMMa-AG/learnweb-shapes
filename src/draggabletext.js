/*
 * $Id: rectangle.js 39913 2017-04-23 23:57:53Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';
import wrap from 'word-wrap';

export default class DraggableText extends Shape {
  get shapeClassName() { return "DraggableText"; }

  constructor(desktop, string, xval, yval, maxlength, textcolor, backgroundColor, backgroundAlpha, deletable, font) {
    super(desktop);
    this.string = string;
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.textcolor = textcolor;
    this.maxlength = maxlength;
    this.backgroundColor = backgroundColor;
    this.backgroundAlpha = backgroundAlpha;
    this.deletable = deletable;
    this.font = font;
    this.resizable = false;
    this.resizeProportional = true;
    this.rotatable = false;
    this.regPoint = 0;
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  get deleterPos() {
    let point = {};
    point.x = this.container.x - 10;
    point.y = this.container.y;
    return point;
  }

  create() {
    const container = this.container;

    if (this.maxlength && this.string && this.string.length > this.maxlength)
      this.string = wrap(this.string, { width: this.maxlength, indent: '', trim: true });


    let label;
    let fontSize;
    let calcFontSize;
    if (this.font) {
      label = new createjs.Text(this.string, this.font);
      calcFontSize= this.font.replace(/[^0-9.]+/g, '');
    } else {
      fontSize = this.desktop.fontSize || '14px';
      label = new createjs.Text(this.string, `${fontSize} sans-serif`);
      calcFontSize= +this.desktop.fontSize.replace(/[^0-9.]+/g, '');
    }


    let metrics = label.getTextMetrics();
    const lwidth = metrics.width;
    const lheight = metrics.height;
    label.lineHeight = calcFontSize * 1.2;

    label.x = 10;
    label.y = 5;
    label.color = this.textcolor;

    let background = new createjs.Shape();
    background.graphics
      .beginStroke(this.backgroundColor)
      .setStrokeStyle(0)
      .beginFill(this.backgroundColor)
      .drawRect(0, 0, lwidth + 20, lheight*1.2+ 15);
    background.alpha = this.backgroundAlpha;

    container.addChild(background);
    container.addChild(label);
    container.cwidth = lwidth;
    container.cheight = lheight;
    container.x = this.xval;
    container.y = this.yval;

    MovableMixin.attach(container);
    container.on("beginmove", () => this.focus())
    container.on("moving", (e) => this.moveBy(e.x, e.y));
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
  }
}
