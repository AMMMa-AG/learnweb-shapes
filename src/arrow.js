/*
 * $Id: arrow.js 46654 2018-10-11 08:41:27Z anna $
 */

import {
  createjs
} from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class Arrow extends Shape {
  get shapeClassName() {
    return "Arrow";
  }

  constructor(desktop, numberHeads, startLength, width, xval, yval, color, strokeWidth, deletable, strokeStyle, adjustable) {
    super(desktop);
    this.numberHeads = this.load('hc', numberHeads);
    this.startLength = startLength;
    this.arrowWidth = width;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval);
    this.color = this.load('c', color);
    this.strokeWidth = this.load('sw', strokeWidth);
    this.deletable = deletable;
    this.strokeStyle = this.load('s', strokeStyle);
    this.rotationValue = 0;
    this.adjustable = adjustable;
    this.init();
  }

  get properties() {
    return [
      'numberHeads',
      'color',
      'strokeWidth',
      'strokeStyle'
    ];
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
    point.y = this.container.y + (a1.y + a2.y) / 2 - (15 * 2 * Math.sin((angle + 90) * Math.PI / 180));
    return point;
  }

  get settingsPos() {
    const a1 = this.a1;
    const a2 = this.a2;

    const angle = Math.atan2(a2.y - a1.y, a2.x - a1.x) * 180 / Math.PI;
    let point = {};
    point.x = this.container.x + (a1.x + a2.x) / 2 - (-15 * 2 * Math.cos((angle + 90) * Math.PI / 180));
    point.y = this.container.y + (a1.y + a2.y) / 2 - (-15 * 2 * Math.sin((angle + 90) * Math.PI / 180));
    return point;
  }

  create() {
    const container = this.container;
    const a1 = this.a1 = new createjs.Shape();
    const a2 = this.a2 = new createjs.Shape();

    a1.x = this.load("a1x", 0);
    a1.y = this.load("a1y", 0);
    a2.x = this.load("a2x", this.startLength);
    a2.y = this.load("a2y", 0);
    this.drawArrowheads(a1, a2);

    let line = new createjs.Shape();
    container.addChild(line);

    let help = new createjs.Shape();
    container.addChild(help);

    container.addChild(a1);
    container.addChild(a2);

    container.x = this.xval;
    container.y = this.yval;

    this.drawLine(a1, a2, true);
    this.drawLine(a1, a2, false);

    MovableMixin.attach(a1);
    a1.on("beginmove", () => this.focus())
    a1.on("moving", (e) => this.moveArrowhead(a1, a1, a2, e.x, e.y));

    MovableMixin.attach(a2);
    a2.on("beginmove", () => this.focus())
    a2.on("moving", (e) => this.moveArrowhead(a2, a1, a2, e.x, e.y));

    MovableMixin.attach(line);
    line.on("beginmove", () => this.focus())
    line.on("moving", (e) => this.moveBy(e.x, e.y));

    MovableMixin.attach(help);
    help.on("beginmove", () => this.focus())
    help.on("moving", (e) => this.moveBy(e.x, e.y));
  }


  drawArrowheads(a1, a2) {
    this.arrowWidth = 10 + 2.5 * this.strokeWidth;
    a1.graphics.clear();
    a1.graphics
      .beginFill(this.color)
      .moveTo(this.arrowWidth / 2, 0)
      .lineTo(this.arrowWidth, this.arrowWidth)
      .lineTo(0, this.arrowWidth)
      .lineTo(this.arrowWidth / 2, 0)
      .lineTo(this.arrowWidth, this.arrowWidth)
      .endStroke();
    a1.regX = this.arrowWidth / 2;
    a1.regY = this.arrowWidth / 2;

    a2.regX = this.arrowWidth / 2;
    a2.regY = this.arrowWidth / 2;
    a2.graphics.clear();
    a2.graphics
      .beginFill(this.color)
      .moveTo(0, 0)
      .lineTo(this.arrowWidth, 0)
      .lineTo(this.arrowWidth / 2, this.arrowWidth)
      .lineTo(0, 0)
      .lineTo(0, this.arrowWidth)
      .endStroke();

    a1.alpha = 1;
    a2.alpha = 1;

    if (this.numberHeads == 0) {
      a1.alpha = 0.01;
      a2.alpha = 0.01;
    }
    if (this.numberHeads == 1) {
      a1.alpha = 0.01;
    }

  }

  moveArrowhead(actHead, firstHead, secHead, x, y) {
    actHead.x += x;
    actHead.y += y;
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
        .setStrokeStyle(this.arrowWidth)
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

    let rotationValue = Math.atan2((a2.y - a1.y), (a2.x - a1.x)) * 180 / Math.PI;
    a1.rotation = rotationValue - 90;
    a2.rotation = rotationValue - 90;
    this.rotationValue = rotationValue;

    this.desktop.update();
  }

  redraw() {
    this.drawLine(this.a1, this.a2, true);
    this.drawLine(this.a1, this.a2, false);
    this.drawArrowheads(this.a1, this.a2);
  }

  showSettings() {
    let arrowContextMenu = this.desktop.arrowContextMenu;
    arrowContextMenu.setVisible(!arrowContextMenu.isVisible());
    arrowContextMenu.setPosition(5, 5);
    this.stage.update();
  }

  get shapeToStorageMap() {
    return Object.assign({}, super.shapeToStorageMap, {
      "x": "x",
      "y": "y",
      "a1x": "a1x",
      "a1y": "a1y",
      "a2x": "a2x",
      "a2y": "a2y",
    });
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("a1x", this.a1.x);
    this.store("a1y", this.a1.y);
    this.store("a2x", this.a2.x);
    this.store("a2y", this.a2.y);
    this.store("c", this.color);
    this.store("sw", this.strokeWidth);
    this.store("s", this.strokeStyle);
    this.store("hc", this.numberHeads);
  }

}
