/*
 * $Id: textfield.js 46695 2018-10-17 20:14:31Z robertj $
 */

import {
  createjs
} from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';
import Utils from './utils';

export default class Textfield extends Shape {
  get shapeClassName() {
    return "Textfield";
  }

  constructor(desktop, startWidth, startString, dragColor, dragAlpha, xval, yval, textColor, backgroundColor, backgroundAlpha, deletable, resizable, fitFont, fontSize, font, adjustable) {
    super(desktop);
    this.startWidth = this.load("w", startWidth);
    this.startString = startString;
    this.dragColor = dragColor;
    this.dragAlpha = dragAlpha;
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);
    this.textColor = this.load("tc", textColor);
    this.backgroundColor = this.load("bc", backgroundColor);
    this.backgroundAlpha = backgroundAlpha;
    this.deletable = deletable;
    this.resizable = resizable;
    this.fitFont = fitFont;
    this.fontSize = this.load("fs", fontSize);
    this.font = this.load("f", font);
    this.regPoint = 0;
    this.adjustable = adjustable;
    this.movable = true;
    this.style = this.load("st", "");
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

  get expanderPos() {
    const container = this.container;
    const size = this.textFieldSize;

    return {
      x: container.x + container.cwidth + 20,
      y: container.y + size.height + 20
    }
  }

  get textFieldSize() {
    const tf = this.tf;
    let height;
    let width;
    let invisible = tf.style.display == "none";

    if (invisible)
      tf.style.display = "block";

    if (!this.fitFont) {
      tf.style.fontSize = this.fontSize + "px";
    }

    height = $(tf).height();
    width = $(tf).width();
    if (invisible)
      tf.style.display = "none";

    return {
      width: width,
      height: height
    }
  }


  create() {
    const container = this.container;
    container.x = this.xval;
    container.y = this.yval;
    container.cwidth = this.startWidth;

    let tf = this.tf = document.createElement(this.fitFont ? 'input' : 'textarea');
    tf.setAttribute('class', 'textbox');
    tf.style.color = this.textColor;
    tf.style.backgroundColor = this.backgroundColor;
    tf.style.height = this.load("th", 24) + "px";
    tf.style.width = this.startWidth + 'px';
    tf.style.position = "absolute";
    tf.style.top = "0";
    tf.style.left = "0";
    tf.setAttribute("placeholder", this.startString);
    tf.style.font = this.fontSize + "px " + this.font;
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
      this.placeholder.alpha = 0.01;
      this.desktop.update();
    });

    container.on("moving", (e) => {
      if (!this.movable)
        return;
      container.x += e.x;
      container.y += e.y;
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
    const container = this.container;
    this.texthold.visible = false;

    tf.style.backgroundColor = Utils.hexToRGB(this.backgroundColor, this.backgroundAlpha);
    tf.style.color = this.textColor;
    tf.style.fontFamily = this.font;
    tf.style.fontWeight = 'normal';
    tf.style.fontStyle = 'normal';

    if (!this.fitFont) {
      tf.style.fontSize = this.fontSize + "px";
    }

    if (this.style == "bold") {
      tf.style.fontWeight = this.style;
    }
    if (this.style == "italic") {
      tf.style.fontStyle = this.style;
    }
    // the placeholder attribute does not have a size, so
    // store it temporarily into value
    let empty = !tf.value;
    if (empty)
      tf.value = this.startString

    if (this.fitFont) {
      // fix for Edge: create a div as a shim to be able to
      // measure the text width because Edge's <input> never overflows.
      const shim = $('<div class="learnweb-shapes-input-shim">');
      // make text wider by appending a &nbsp;
      shim.text(tf.value + "\xa0");
      shim[0].style.fontSize = tf.style.fontSize;
      shim[0].style.lineHeight = tf.style.lineHeight;
      $("body").append(shim);
      tf.style.width = shim.width() + 'px';
      shim.remove();

      let size = this.textFieldSize;
      let fontSize = size.height * 0.7 + 'px';
      tf.style.fontSize = fontSize;
      size = this.textFieldSize;

      let frame = this.frame;
      frame.graphics.clear();
      frame.graphics
        .beginFill(this.dragColor)
        .drawRect(0, 0, size.width, 20);
      container.cwidth = size.width;
    } else {
      tf.style.height = (tf.offsetHeight - tf.scrollHeight) + 'px';
      tf.style.height = tf.scrollHeight + 'px';
    }

    if (empty)
      tf.value = "";

    this.desktop.moveAdorners(this);
    this.desktop.update();
  }

  beforeResize() {
    const size = this.textFieldSize;
    this.ratio = size.height / size.width;
  }

  resizeBy(evt) {
    const container = this.container;
    const tf = this.tf;
    let size = this.textFieldSize;

    if (this.fitFont) {
      tf.style.width = size.width + evt.x + 'px';
      tf.style.height = (size.width * this.ratio) + 'px';

      size = this.textFieldSize;
      let fontSize = size.height * 0.7 + 'px';
      tf.style.fontSize = fontSize;
      this.fontSize = size.height * 0.7;
    } else {
      tf.style.width = size.width + evt.x + 'px';
      tf.style.height = size.height + evt.y + 'px';
    }

    size = this.textFieldSize;
    container.cwidth = size.width;

    this.drawPlaceholder();
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

  updateFontSize() {
    let tf = this.tf;
    let metrics = this.texthold.getTextMetrics();

    tf.style.display = "block";
    tf.style.fontSize = this.fontSize + "px";

    if (!this.fitFont) {
      tf.style.height = (tf.offsetHeight - tf.scrollHeight) + 'px';
      tf.style.height = tf.scrollHeight + 'px';

      let substring = this.longestSubstring(tf.value);
      let hold = new createjs.Text(substring, this.style + " " + this.fontSize + "px " + this.font);
      let holdMetrics = hold.getTextMetrics()
      if (holdMetrics.width > this.container.cwidth) {
        tf.style.width = holdMetrics.width + 5 + "px";
        this.container.cwidth = holdMetrics.width + 5;
      }

    } else {
      tf.style.height = this.fontSize / 0.7 + 'px';
      tf.style.width = metrics.width + 5 + "px";
      this.container.cwidth = metrics.width + 5;
    }
  }

  longestSubstring(string) {
    let strList = string.split(/\s/);
    let longest = 0;
    let lString;
    for (let i = 0; i <= strList.length - 1; i++) {
      if (longest < strList[i].length) {
        longest = strList[i].length;
        lString = strList[i];
      }
    }
    return lString;
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
    let lineHeight = parseInt(tf.style.lineHeight);
    tf.style.display = "none";

    if (empty)
      tf.value = "";

    container.removeAllChildren();

    let frame = this.frame = new createjs.Shape();
    frame.graphics
      .setStrokeStyle(1)
      .beginStroke(this.dragColor)
      .beginFill(this.dragColor)
      .drawRect(0, 0, textSize.width + 2, 20);
    frame.alpha = this.dragAlpha;

    let content = this.content = new createjs.DOMElement(tf);
    content.x = 0;
    content.y = 23;
    content.regX = 0;
    content.regY = 0;

    let fontSize;

    if (this.fitFont == true) {
      fontSize = $(tf).css('fontSize');
    } else {
      fontSize = this.fontSize + "px";
    }

    let texthold = this.texthold = new createjs.Text("", this.style + " " + fontSize + " " + this.font, this.textColor);
    texthold.text = text;
    texthold.lineWidth = textSize.width;
    texthold.lineHeight = lineHeight;
    texthold.x = 4;
    texthold.y = 23;

    let placeholder = this.placeholder = new createjs.Shape();
    placeholder.graphics
      .setStrokeStyle(1)
      .beginStroke(this.backgroundColor)
      .beginFill(this.backgroundColor)
      .drawRect(0, 0, textSize.width + 2, textSize.height);
    placeholder.alpha = this.backgroundAlpha;

    container.addChild(frame, content, placeholder);

    container.addChild(texthold);
    tf.style.width = textSize.width;

    placeholder.x = 0;
    placeholder.y = 20;

    this.desktop.update();
  }

  showSettings() {
    let textContextMenu = this.desktop.textContextMenu;
    textContextMenu.setVisible(!textContextMenu.isVisible());
    textContextMenu.setPosition(5, 5);
    this.stage.update();
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
    this.store("tv", this.tf.value);
    this.store("bc", this.backgroundColor);
    this.store("tc", this.textColor);
    this.store("fs", this.fontSize)
    this.store("st", this.style)
    this.store("f", this.font)
  }
}
