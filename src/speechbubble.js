/*
 * $Id: textfield.js 44244 2018-02-21 15:00:52Z robertj $
 */

import {
  createjs
} from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';
import Utils from './utils';

/**
 * specifies the factor to multiply the line height with.
 */
const LineHeightFactor = 1.1;

export default class SpeechBubble extends Shape {
  get shapeClassName() {
    return "SpeechBubble";
  }

  constructor(desktop, startWidth, startString, lockText, backgroundColor, xval, yval, textColor, strokeColor, strokeWidth, deletable, bubbleStyle, font, movable, adjustable) {
    super(desktop);
    this.startWidth = this.load("w", startWidth);
    this.startString = startString;
    this.lockText = lockText;
    this.textColor = this.load("tc", textColor);
    this.backgroundColor = this.load("bc", backgroundColor);
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.deletable = deletable;
    this.bubbleStyle = bubbleStyle;

    let tmp = font.split('px ', 2);
    let tmpFont = tmp[1];
    let fontSize = Number(tmp[0]);

    this.fontSize = fontSize;
    this.font = this.load("f", tmpFont);
    this.fontSize = this.load("fs", fontSize);
    this.movable = movable;
    this.adjustable = adjustable;
    this.style =  this.load("st", "");
    this.init();
  }


  get layer() {
    return Shape.ToolLayer;
  }

  get tf() {
    return this._tf;
  }

  set tf(value) {
    this._tf = value;
  }

  get frame() {
    return this._frame;
  }

  set frame(value) {
    this._frame = value;
  }

  get content() {
    return this._content;
  }

  set content(value) {
    this._content = value;
  }

  get placeholder() {
    return this._placeholder;
  }

  set placeholder(value) {
    this._placeholder = value;
  }

  get texthold() {
    return this._texthold;
  }

  set texthold(value) {
    this._texthold = value;
  }

  get deleterPos() {
    const container = this.container;

    return {
      x: container.x + container.cwidth + 20,
      y: container.y - 10
    }
  }

  get settingsPos() {
    const container = this.container;

    return {
      x: container.x - 10,
      y: container.y - 10
    }
  }


  showSettings() {
    let textContextMenu = this.desktop.textContextMenu;
    textContextMenu.setVisible(!textContextMenu.isVisible());
    textContextMenu.setPosition(5, 5);
    this.stage.update();
    this.drawPlaceholder();
  }

  /**
   * Returns width, height of the text field HTML element.
   */
  get textFieldSize() {
    const tf = this.tf;

    let invisible = tf.style.display == "none";

    if (invisible)
      tf.style.display = "block";

    let width = $(tf).width();
    let height = $(tf).height();

    if (invisible)
      tf.style.display = "none";

    return {
      width,
      height
    }
  }


  create() {
    const container = this.container;
    container.x = this.xval;
    container.y = this.yval;
    container.cwidth = this.startWidth;


    let frame = new createjs.Shape();
    container.frame = frame;

    let tf = this.tf = document.createElement('textarea');
    tf.setAttribute('class', 'speechbubble');
    tf.style.color = this.textColor;
    tf.style.backgroundColor = this.backgroundColor;
    tf.style.height = this.load("th", 24) + "px";
    tf.style.width = this.startWidth + 'px';
    tf.style.position = "absolute";
    tf.style.top = "0";
    tf.style.left = "0";
    tf.setAttribute("placeholder", this.startString);
    tf.style.fontSize = this.load("tf", "1em");
    tf.style.font = this.font;
    tf.value = this.load("tv", "");
    tf.addEventListener("input", this.changed.bind(this));

    // append HTML element to the canvas' parent
    this.stage.canvas.parentNode.appendChild(tf);

    MovableMixin.attach(container);
    container.on("beginmove", () => {
      this.desktop.focus(this);
      tf.style.display = 'block';
      tf.focus();
      this.changed();
      tf.style.width = container.cwidth + 'px';
      this.desktop.moveAdorners(this);
      this.desktop.update();
    });

    container.on("moving", (e) => {
      if (!this.movable)
        return;
      container.x += e.x;
      container.y += e.y;
      container.addChild(this.content);
      this.desktop.moveAdorners(this);
      this.desktop.update();
    });
  }

  afterCreate() {
    const tf = this.tf;
    this.drawPlaceholder();
    // trigger "changed"
    tf.style.display = "block";
    // we trigger twice to pick up the font size adjustments
    this.changed();
    this.changed();
    tf.style.display = "none";
  }

  changed() {
    const tf = this.tf;

    tf.style.backgroundColor = Utils.hexToRGB(this.backgroundColor, 1);
    tf.style.color = this.textColor;
    tf.style.fontFamily = this.font;
    tf.style.fontWeight = 'normal';
    tf.style.fontStyle = 'normal';
    tf.style.fontSize = this.fontSize + "px";


    if (this.style == "bold") {
      tf.style.fontWeight = this.style;
    }
    if (this.style == "italic") {
      tf.style.fontStyle = this.style;
    }

    this.texthold.visible = false;

    tf.style.height = (tf.offsetHeight - tf.scrollHeight) + 'px';
    tf.style.height = tf.scrollHeight + 'px';

    this.desktop.moveAdorners(this);
    this.drawFrame();
    this.desktop.update();
  }

  onBlur() {
    // don't blur on Android as a reaction to 'resize'
    if (this.desktop.isAndroid && this.desktop.blurDuringResize)
      return;

    super.onBlur();
    this.texthold.visible = true;
    this.tf.blur();
    this.tf.style.display = 'block';
    this.drawPlaceholder();
  }

  drawFrame() {
    const container = this.container;
    container.removeAllChildren();
    let frame = container.frame
    frame.graphics.clear();

    let textSize = this.textFieldSize;
    frame.graphics
      .setStrokeStyle(this.strokeWidth)
      .beginStroke(this.strokeColor)
      .beginFill(this.backgroundColor)

    if (this.bubbleStyle == 0) {
      frame.graphics
        .drawRoundRect(0, 0, textSize.width + 26, textSize.height + 20, 20, 20, 20, 20)
        .endStroke()
        .moveTo(textSize.width * 0.8, textSize.height + 20)
        .beginStroke(this.strokeColor)
        .beginFill(this.backgroundColor)
        .drawCircle(textSize.width * 0.7, textSize.height + 27, 13)
        .endStroke()
        .beginStroke(this.strokeColor)
        .beginFill(this.backgroundColor)
        .drawCircle(textSize.width * 0.7 + 10, textSize.height + 45, 8)

    }
    if (this.bubbleStyle == 1) {
      frame.graphics
        .drawRoundRect(0, 0, textSize.width + 26, textSize.height + 20, 10, 10, 10, 10)
        .endStroke()
        .moveTo(textSize.width * 0.8, textSize.height + 20)
        .beginStroke(this.strokeColor)
        .beginFill(this.backgroundColor)
        .lineTo(textSize.width * 0.7, textSize.height + 15)

        .lineTo(textSize.width * 0.7 + 20, textSize.height + 40)
        .lineTo(textSize.width * 0.7 + 30, textSize.height + 15)
        .endStroke()
    }
    if (this.bubbleStyle == 2) {
      frame.graphics
        .drawRoundRect(0, 0, textSize.width + 26, textSize.height + 20, 0, 0, 0, 0)
        .endStroke()
    }

    this.container.addChild(frame);
    this.desktop.update();
  }

  redraw() {
    this.drawPlaceholder();
  }

  updateFontSize() {
    let tf = this.tf;
    tf.style.display = "block";
    tf.style.fontSize = this.fontSize + "px";
    tf.style.backgroundColor = Utils.hexToRGB(this.backgroundColor, 1);
    tf.style.color = this.textColor;
    tf.style.fontFamily = this.font;
    tf.style.fontWeight = 'normal';
    tf.style.fontStyle = 'normal';
    tf.style.fontSize = this.fontSize + "px";


    if (this.style == "bold") {
      tf.style.fontWeight = this.style;
    }
    if (this.style == "italic") {
      tf.style.fontStyle = this.style;
    }

    tf.style.height = (tf.offsetHeight - tf.scrollHeight) + 'px';
    tf.style.height = tf.scrollHeight + 'px';


    this.drawPlaceholder();
    tf.style.display = "none";

  }

  drawPlaceholder() {
    const container = this.container;
    const tf = this.tf;

    let text = tf.value;
    let empty = !text;

    if (empty) {
      text = this.startString;
      tf.value = this.startString;
    }

    let textSize = this.textFieldSize;

    tf.style.display = "none";
    if (this.lockText == false && empty) {
      tf.value = "";
    }

    container.removeAllChildren();
    this.drawFrame();

    let content = this.content = new createjs.DOMElement(tf);
    content.x = 13;
    content.y = 10;
    content.regX = 0;
    content.regY = 0;
    container.addChild(content);


    let texthold = this.texthold = new createjs.Text("", this.style + " " + this.fontSize + "px " + this.font, this.textColor);

    texthold.textAlign = "center";
    texthold.text = text;
    texthold.color = this.textColor;
    texthold.lineWidth = textSize.width;
    texthold.lineHeight = texthold.getMeasuredLineHeight() * LineHeightFactor;
    texthold.x = textSize.width / 2 + content.x;
    texthold.y = content.y;

    container.addChild(texthold);

    // sync tf
    tf.style.width = textSize.width+ "px";
    tf.style.lineHeight = texthold.lineHeight + "px";

    this.desktop.update();
  }

  get shapeToStorageMap() {
    return Object.assign({}, super.shapeToStorageMap, {
      "x": "x",
      "y": "y",
      "width": "w",
      "text": "tv",
      "textColor": "tc",
      "backgroundColor": "bc"
    });
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("w", this.container.cwidth);
    this.store("th", this.textFieldSize.height);
    this.store("fs", this.fontSize);
    this.store("f", this.font);
    this.store("st", this.style);
    this.store("tv", this.tf.value);
    this.store("bc", this.backgroundColor);
    this.store("tc", this.textColor);
  }
}
