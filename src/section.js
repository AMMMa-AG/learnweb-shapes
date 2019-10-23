/*
 * $Id: section.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class Section extends Shape {
  get shapeClassName() { return "Section"; }

  constructor(desktop, startLength, xval, yval, rangex1, rangex2, color, strokeWidth, deletable) {
    super(desktop);
    this.startLength = startLength;
    this.rangex1 = rangex1;
    this.rangex2 = rangex2;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval+30);
    this.color = color;
    this.strokeWidth = strokeWidth;
    this.deletable = deletable;
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  get a1() {
    return this._a1;
  }

  set a1(value) {
    this._a1 = value;
  }

  get a2() {
    return this._a2;
  }

  set a2(value) {
    this._a2 = value;
  }

  get deleterPos() {
    const a1 = this.a1;
    const a2 = this.a2;

    const angle = Math.atan2(a2.y - a1.y, a2.x - a1.x) * 180 / Math.PI;
    let point = {};
    point.x = this.container.x + (a1.x + a2.x) / 2 - (15 * 2 * Math.cos((angle + 90) * Math.PI / 180));
    point.y = this.container.y - 30;
    return point;
  }

  create() {
    const container = this.container;
    const a1 = this.a1 = new createjs.Shape();
    a1.x = this.load("a1x", 0);
    a1.y = this.load("a1y", 0);

    a1.graphics
      .setStrokeStyle(this.strokeWidth)
      .beginStroke(this.color)
      .moveTo(0, 0)
      .lineTo(0, 30)
      .endStroke();

    a1.regY = 15;

    const a2 = this.a2 = new createjs.Shape();
    a2.x = this.load("a2x", this.startLength);
    a2.y = this.load("a2y", 0);

    a2.regY = 15;
    a2.graphics
      .setStrokeStyle(this.strokeWidth)
      .beginStroke(this.color)
      .moveTo(0, 0)
      .lineTo(0, 30)
      .endStroke();


    let line = new createjs.Shape();
    container.addChild(line);

    let help = new createjs.Shape();
    container.addChild(help);

    container.a1= a1;
    container.a2 = a2;
    container.addChild(a1);
    container.addChild(a2);

    container.x = this.xval;
    container.y = this.yval;

    this.drawLine(a1, a2, true);
    this.drawLine(a1, a2, false);

    container.visible = true;


    MovableMixin.attach(a1);
    a1.on("beginmove", () => this.focus())
    a1.on("moving", (e) => this.moveHead(a1, a1, a2, e));

    MovableMixin.attach(a2);
    a2.on("beginmove", () => this.focus())
    a2.on("moving", (e) => this.moveHead(a2, a1, a2, e));

    MovableMixin.attach(line);
    line.on("beginmove", () => this.focus())
    line.on("moving", (e) => this.moveBy(e.x, 0));

    MovableMixin.attach(help);
    help.on("beginmove", () => this.focus())
    help.on("moving", (e) => this.moveBy(e.x, 0));
  }

  moveHead(actHead, firstHead, secHead, e) {

    let h_pt = actHead.localToStage(e.x, 0);

    if (h_pt.x> this.rangex1+30 && h_pt.x< this.rangex2-30) {
          actHead.x += e.x;
    }

    this.drawLine(firstHead, secHead, false);
    this.drawLine(firstHead, secHead, true);
    this.desktop.moveAdorners(this);
    this.desktop.update()
  }

  drawLine(a1, a2, transparent) {

    const container = this.container;
    let line;

    if (transparent == true) {
      line = container.getChildAt(1);
    } else {
      line = container.getChildAt(0);
    }

    line.graphics.clear();

    if (this.strokeStyle == 1) {
      line.graphics.setStrokeDash([12, 3]);
    }

    if (transparent == true) {
      line.alpha = 0.01;
      line.graphics
        .setStrokeStyle(this.width)
        .beginStroke("#ffffff")
        .moveTo(a1.x, a1.y)
        .lineTo(a2.x, a2.y)
        .endStroke();
    } else {
      line.alpha = 1;
      line.graphics
        .setStrokeStyle(this.strokeWidth)
        .beginStroke(this.color)
        .moveTo(a1.x, a1.y)
        .lineTo(a2.x, a2.y)
        .endStroke();
    }

    line.graphics
      .setStrokeStyle(this.strokeWidth)
      .beginStroke(this.color)
      .moveTo(a1.x, a1.y)
      .lineTo(a2.x, a2.y)
      .endStroke();


    this.desktop.update();
  }

  redraw() {
    this.drawLine(this.a1, this.a2, true);
    this.drawLine(this.a1, this.a2, false);
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("a1x", this.a1.x);
    this.store("a1y", this.a1.y);
    this.store("a2x", this.a2.x);
    this.store("a2y", this.a2.y);
  }

}
