/*
 * $Id: simpleshape.js 46575 2018-10-06 20:39:14Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

/**
 * Base class for simple shapes (Circle, Rectangle, etc.)
 */
export default class SimpleShape extends Shape {
  get shapeClassName() { return "SimpleShape"; }

  constructor(desktop) {
    super(desktop);
    this.movable = this.load("m", true);
    this.color = this.load("c", "#0000ff");
    this.backgroundColor = this.load("bc", "#0000ff");
    this.backgroundAlpha = this.load("ba", 1);
    this.strokeWidth = this.load("sw", 3);
    this.focusable = true;
    this.pinable = true;
    this.adjustable = true;
  }

  get properties() {
    return [
      'color',
      'strokeWidth',
      'backgroundAlpha',
      'backgroundColor'
    ];
  }

  get layer() {
    return Shape.ToolLayer;
  }

  init() {
    super.init();
    this.setupEvents();
    this.focus();
    this.resizeBy({ x: 0, y: 0 });
  }

  setupEvents() {
    const container = this.container;
    MovableMixin.attach(container);
    container.on("beginmove", () => this.focus());
    container.on("moving", (evt) => {
      if (this.movable)
        this.moveBy(evt.x, evt.y);
    });
  }

  focus() {
    if (this.focusable) super.focus();
  }

  resizeBy(evt) {
    const outline = new createjs.Shape();
    const inner = new createjs.Shape();
    const container = this.container;

    const color = this.color;
    const strokeWidth = this.strokeWidth;
    const alpha = this.backgroundAlpha;
    const minSize = this.resizable ? 40 : 0;

    container.removeAllChildren();

    outline.graphics.beginStroke(color);
    outline.graphics.setStrokeStyle(strokeWidth);
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

    let distanceX = Math.max(minSize, container.cwidth + px);
    let distanceY = Math.max(minSize, container.cheight + py);

    if (this.resizeProportional == true) {
      if (distanceX > distanceY) {
        this.update(distanceX, distanceX, outline, inner);
      } else {
        this.update(distanceY, distanceY, outline, inner);
      }
    } else {
      this.update(distanceX, distanceY, outline, inner);
    }

    container.addChild(inner);
    container.addChild(outline);
  }

  /**
   * overriden classes should update the visual shape and its
   * dependent objects when this method is invoked.
   */
  update(newWidth, newHeight, outer, inner) {}


  redraw() {
    const outline = new createjs.Shape();
    const inner = new createjs.Shape();
    const container = this.container;

    container.removeAllChildren();

    outline.graphics.beginStroke(this.color);
    outline.graphics.setStrokeStyle(this.strokeWidth);
    inner.alpha = this.backgroundAlpha;

    this.update(container.cwidth, container.cheight, outline, inner);
    container.addChild(inner);
    container.addChild(outline);
    this.desktop.update();
  }


  get shapeToStorageMap() {
    return Object.assign({}, super.shapeToStorageMap, {
      "x": "x",
      "y": "y",
      "width": "w",
      "height": "h",
      "rotation": "r",
      "movable": "m",
      "focusable": "f",
      "adjustable": "a",
      "color": "c",
      "backgroundColor": "bc",
      "backgroundAlpha": "ba",
      "strokeWidth": "sw"
    });
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("w", this.container.cwidth);
    this.store("h", this.container.cheight);
    this.store("r", this.container.rotation);
    this.store("m", this.movable);
    this.store("f", this.focusable);
    this.store("a", this.adjustable);
    this.store("c", this.color);
    this.store("bc", this.backgroundColor);
    this.store("ba", this.backgroundAlpha);
    this.store("sw", this.strokeWidth);
  }

}
