/*
 * $Id: draggable.js 46575 2018-10-06 20:39:14Z robertj $
 */

import { createjs } from 'EaselJS';
import SimpleShape from './simpleshape';

export default class Draggable extends SimpleShape {
  get shapeClassName() { return "Draggable"; }

  constructor(desktop, src, width, height, xval, yval, labelText, labelColor, deletable, resizable, rotatable, regPoint, layer, pinable, mirror, adjustable) {
    super(desktop);
    this.conwidth = this.load("w", width);
    this.conheight = this.load("h", height);
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.labelText = labelText;
    this.labelColor = labelColor;
    this.deletable = deletable;
    this.resizable = resizable;
    this.rotatable = rotatable;
    this.regPoint = regPoint;
    this.src = src;
    this._layer = layer;
    this.pinable = pinable;
    this.mirror = mirror;
    this.adjustable = adjustable;
    this.mirrored = this.load("mi", false);

    if (!this.src) {
      console.warn("Draggable: no src was supplied. Giving up.");
      return;
    }

    // start preloading image when it was specified by string
    if (typeof(src) === "string") {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = src;
      img.onload = () => {
        this.bitmap = new createjs.Bitmap(img);
        if (this.bitmap.getBounds()) {
          this.init();
        } else {
          console.warn("Draggable:", `could not determine the bounds of "${src}". Aborting.`);
        }
      };
    } else {
      this.bitmap = new createjs.Bitmap(src);
      this.init();
    }
  }

  get layer() {
    return this._layer;
  }

  /**
   * Gets the initial bitmap of the draggable.
   */
  get bitmap() {
    return this._bitmap;
  }

  /**
   * Sets the initial bitmap of the draggable.
   */
  set bitmap(value) {
    this._bitmap = value;
  }

  /**
   * Gets the mutated draggable.
   */
  get image() {
    return this._image;
  }

  /**
   * Sets the mutated draggable.
   */
  set image(value) {
    this._image = value;
  }

  create() {
    const container = this.container;
    const image = this.image = this.bitmap.clone();

    if (this.conwidth) {
      let sx = this.conwidth / image.getBounds().width;
      image.scaleX = sx;
      image.scaleY = sx;
    } else if (this.conheight) {
      let sy = this.conheight / image.getBounds().height;
      image.scaleX = sy;
      image.scaleY = sy;
    } else {
      this.conwidth = image.getBounds().width / this.stage.scaleX;
    }

    let hitArea = new createjs.Shape();
    hitArea.graphics
      .beginFill("#000")
      .drawRect(0, 0, image.getBounds().width, image.getBounds().height);
    image.hitArea = hitArea;

    container.addChild(image);

    let ratio = image.getBounds().width / image.getBounds().height;

    if (this.conwidth) {
      container.cwidth = this.conwidth;
      container.cheight = container.cwidth / ratio;
    } else if (this.conheight) {
      container.cheight = this.conheight;
      container.cwidth = container.cheight / ratio;
    }

    container.rotation = this.load("r", 0);
    if (this.regPoint == 1) {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }

    // create label on demand
    if (this.labelText) {
      let fontSize = this.desktop.fontSize || '14px';
      this.label = new createjs.Text(this.labelText, `${fontSize} sans-serif`);
      this.label.color = this.labelColor;
      this.label.mask = new createjs.Shape();
      container.addChild(this.label);
      this.alignLabel();
    }

    container.x = this.xval;
    container.y = this.yval;

    if (this.mirrored) {
      this.mirrorObject();
    }
  }

  mirrorObject() {
    const container = this.container;

    if (this.regPoint == 0) {
      container.regX = 0;
      container.regY = 0;
    } else {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }

    if (container.children[0].scaleX < 0) {
      container.children[0].x = container.children[0].x - container.cwidth;
    } else {
      container.children[0].x = container.cwidth;
    }

    container.children[0].scaleX = container.children[0].scaleX * -1;
    this.mirrored = container.children[0].scaleX < 0;
  }

  resizeBy(evt) {
    const container = this.container;
    const minSize = this.resizable ? 40 : 0;
    let mirrored;

    if (this.regPoint == 0) {
      container.regX = 0;
      container.regY = 0;
    } else {
      container.regX = container.cwidth / 2;
      container.regY = container.cheight / 2;
    }

    if (container.children[0].scaleX < 0) {
      mirrored = -1;
    } else {
      mirrored = 1;
    }

    const angle = -container.rotation * Math.PI / 180;
    let px = Math.cos(angle) * (evt.x) - Math.sin(angle) * (evt.y);
    let py = Math.sin(angle) * (evt.x) + Math.cos(angle) * (evt.y);

    let distanceX = Math.max(minSize, container.cwidth + px);
    let distanceY = Math.max(minSize, container.cheight + py);

    let bounds = this.bitmap.getBounds();
    let startWidth = bounds.width;
    let startHeight = bounds.height;


    if (distanceX > distanceY) {
      this.image.scaleX = mirrored * (distanceX / startWidth);
      this.image.scaleY = distanceX / startWidth;
      container.cwidth = distanceX;
      container.cheight = mirrored * startHeight * this.image.scaleX;
    } else {
      this.image.scaleX = mirrored * (distanceY / startHeight);
      this.image.scaleY = distanceY / startHeight;
      container.cheight = distanceY;
      container.cwidth = mirrored * startWidth * this.image.scaleY;
    }

    if (container.children[0].scaleX < 0) {
      this.image.x = container.cwidth;
      this.image.y = 0;
    } else {
      this.image.x = 0;
      this.image.y = 0;
    }

    this.alignLabel();
  }

  onFocus() {
    super.onFocus();
    this.alignLabel();
  }

  onBlur() {
    super.onBlur();
    this.alignLabel();
  }

  alignLabel() {
    if (!this.label) return;

    let container = this.container;
    let label = this.label;

    // position
    let metrics = label.getTextMetrics();

    // adjust x according to focus (the adorners are extending into the content area)
    let offset = this.pinable ? 20 : 4;
    label.x = this.focused ? offset : 4;
    label.y = container.cheight - metrics.height - 4;

    // clipping
    let mask = label.mask;
    mask.graphics
      .clear()
      .drawRect(0, 0, container.cwidth, container.cheight);
  }

  persist() {
    super.persist();
    this.store("mi", this.mirrored);
  }
}
