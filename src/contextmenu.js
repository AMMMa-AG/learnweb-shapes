import {
  createjs
} from 'EaselJS';
import MovableMixin from './movablemixin';

export default class ContextMenu {
  constructor(desktop) {
    this.desktop = desktop;
    this.paddingLeft = this.paddingTop = 10;
    this.backgroundColor = "#cccccc";
    this.highlightList = [];
    this.dialogWidth = 120;
    this.thin = 1;
    this.medium = 3;
    this.thick = 5;
    this.colorList = ["#ff3333", "#3333cc", "#33cc00", "#ff9900"];
  }

  drawContextMenu() {
    let container = this.container = new createjs.Container();
    this.dialogHeight = 195;

    this.drawMenuBackground(container)

    this.addStrokeWidth();
    this.addColor(this.colorList);
    this.addAlpha();
    this.addDeleteButton();

    this.strokeWidthContainer.y = 0;
    this.colorContainer.y = 60;
    this.alphaContainer.y = 130;
    this.delContainer.y = 160;

    let seperatorPositions = [80, 120, 150]
    this.drawSeparator(seperatorPositions);
  }

  drawTextContextMenu() {
    let container = this.container = new createjs.Container();
    this.dialogHeight = 340;
    this.drawMenuBackground(container)

    let seperatorPositions = [60, 140, 185, 240, 295]
    this.drawSeparator(seperatorPositions);

    let label = new createjs.Text("Hintergrundfarbe", "12px sans-serif", "#000");
    container.addChild(label);
    label.y = 190;
    label.x = 5;

    let label2 = new createjs.Text("Textfarbe", "12px sans-serif", "#000");
    container.addChild(label2);
    label2.y = 245;
    label2.x = 5;

    this.colorList = ["#ffffff", "#3333cc", "#33cc00", "#ff9900"];
    this.textColorList = ["#000000", "#ffffff"];

    this.addFont();
    this.addColor(this.colorList);
    this.addTextColor(this.textColorList);
    this.addFontStyle();
    this.addFontSize();
    this.addDeleteButton();

    this.fontContainer.y = 0;
    this.fontStyleContainer.y = 60;
    this.fontSizeContainer.y = 110;
    this.colorContainer.y = 180;
    this.textColorContainer.y = 235;
    this.delContainer.y = 305;
  }

  drawArrowContextMenu() {
    let container = this.container = new createjs.Container();
    this.dialogHeight = 305;
    this.drawMenuBackground(container)

    let seperatorPositions = [80, 140, 220, 260]
    this.drawSeparator(seperatorPositions);

    this.addStrokeWidth();
    this.addStrokeType();
    this.addColor(this.colorList);
    this.addHeadCount();
    this.addDeleteButton();

    this.strokeWidthContainer.y = 0;
    this.strokeStyleContainer.y = 80;
    this.colorContainer.y = 200;
    this.headCountContainer.y = 140;
    this.delContainer.y = 270;
  }

  drawMenuBackground(container) {
    let stage = this.stage = this.desktop.stage;
    let rect = new createjs.Shape();
    rect.graphics
      .setStrokeStyle(2)
      .beginStroke("#fff")
      .beginFill(this.backgroundColor)
      .drawRoundRect(0, 0, this.dialogWidth, this.dialogHeight, 5);

    container.addChild(rect);
    stage.addChild(container);
    container.visible = false;
  }

  drawSeparator(list) {
    let line = new createjs.Shape();
    line.graphics
      .setStrokeStyle(2)
      .beginStroke("#fff")

    for (let i = 0; i <= list.length; i++) {
      line.graphics.moveTo(0, list[i])
        .lineTo(this.dialogWidth, list[i])
    }

    this.container.addChild(line)
  }

  addStrokeWidth() {
    let strokeWidthContainer = this.strokeWidthContainer = new createjs.Container();
    let yPos = 20;

    this.drawStrokeItem(this.thin, yPos - 10);
    this.drawStrokeItem(this.medium, yPos * 2 - 10);
    this.drawStrokeItem(this.thick, yPos * 3 - 10);

    this.container.addChild(strokeWidthContainer)
  }

  addFont() {
    let fontContainer = this.fontContainer = new createjs.Container();
    let yPos = 20;

    this.drawFontItem("serif", yPos - 10);
    this.drawFontItem("sans-serif", yPos * 2 - 10);

    this.container.addChild(fontContainer)
  }

  addFontStyle() {
    let fontStyleContainer = this.fontStyleContainer = new createjs.Container();
    let yPos = 20;

    this.drawFontStyleItem("", yPos - 10);
    this.drawFontStyleItem("italic", yPos * 2 - 10);
    this.drawFontStyleItem("bold", yPos * 3 - 10);

    this.container.addChild(fontStyleContainer)
  }

  addFontSize() {
    let fontSizeContainer = this.fontSizeContainer = new createjs.Container();
    let xPos = 100 / 3;

    this.drawFontSizeItem(14, 12.5);
    this.drawFontSizeItem(28, xPos + 12.5);
    this.drawFontSizeItem(40, xPos * 2 + 12.5);

    this.container.addChild(fontSizeContainer)
  }


  addStrokeType() {
    let strokeStyleContainer = this.strokeStyleContainer = new createjs.Container();
    let yPos = 20;

    this.drawStrokeTypeItem(0, yPos - 10);
    this.drawStrokeTypeItem(1, yPos * 2 - 10);

    this.container.addChild(strokeStyleContainer)
  }

  addColor(colorList) {
    let colorContainer = this.colorContainer = new createjs.Container();
    let margin = this.dialogWidth / 5;

    for (let i = 0; i < colorList.length; i++) {
      this.drawColorItem(colorList[i], margin * (i + 1));
    }
    this.container.addChild(colorContainer)
  }

  addTextColor(textColorList) {
    let textColorContainer = this.textColorContainer = new createjs.Container();
    let margin = this.dialogWidth / 5;

    for (let i = 0; i < textColorList.length; i++) {
      this.drawTextColorItem(textColorList[i], margin * (i + 1));
    }
    this.container.addChild(textColorContainer)
  }

  addAlpha() {
    let alphaContainer = this.alphaContainer = new createjs.Container();

    let alpha = new createjs.Shape();
    alpha.graphics.setStrokeStyle(2)
      .setStrokeStyle(2)
      .beginStroke("#fff")
      .beginLinearGradientFill(["rgba(0,0,0,0)", "rgba(0,0,0,1)"], [0, 1], 0, 0, this.dialogWidth - 25.5, 10)
      .drawRect(0, 0, this.dialogWidth - 25.5, 10);

    let alphaPicker = new createjs.Shape();
    alphaPicker.graphics.setStrokeStyle(2)
      .setStrokeStyle(2)
      .beginStroke("#fff")
      .beginFill("#e3e3e3")
      .drawCircle(0, 5, 5, 5);

    let hit = new createjs.Shape();
    hit.graphics.setStrokeStyle(2)
      .beginStroke("#000")
      .beginFill("#000")
      .drawCircle(0, 5, 10, 10);
    alphaPicker.hitArea = hit;

    alphaContainer.x = this.paddingLeft + 2.5;
    alphaContainer.addChild(alpha, alphaPicker)
    this.alphaContainer.alphaPicker = alphaPicker;

    this.container.addChild(alphaContainer)

    MovableMixin.attach(alphaPicker);
    alphaPicker.on("moving", (e) => this.moveAlphaPicker(e.x, e.y));
  }

  moveAlphaPicker(x, y) {
    let picker = this.alphaContainer.alphaPicker;
    let container = this.container;
    let factor = this.desktop.naturalScaleFactor;

    let h_pt = picker.localToStage(x, 0);

    let range1 = (container.x + 12.5) * factor.x;
    let range2 = (container.x + this.dialogWidth - 12.5) * factor.x;

    if (h_pt.x > range1 && h_pt.x < range2) {
      picker.x += x / factor.x;
    }

    let length = range2 - range1;
    this.updateAlpha(picker.x * factor.x / length);
    this.desktop.update();
  }

  setPosAlphaPicker(percent) {
    let picker = this.alphaContainer.alphaPicker;
    let length = this.dialogWidth - 25;
    picker.x = length * percent;
  }

  addHeadCount() {
    let headCountContainer = this.headCountContainer = new createjs.Container();
    let yPos = 20;

    this.drawHeadCountItem(0, yPos - 10);
    this.drawHeadCountItem(1, yPos * 2 - 10);
    this.drawHeadCountItem(2, yPos * 3 - 10);
    this.container.addChild(headCountContainer)
  }

  addDeleteButton() {
    let delContainer = this.delContainer = new createjs.Container();
    let label = new createjs.Text("Element löschen", "12px Sans-Serif", "#000");
    label.x = label.y = 5;

    let hit = new createjs.Shape();
    hit.graphics.setStrokeStyle(2)
      .beginStroke("#fff")
      .beginFill("#e3e3e3")
      .drawRoundRect(0, 0, label.getMeasuredWidth() + 10, label.getMeasuredHeight() + 10, 5);
    label.hitArea = hit;

    delContainer.addChild(hit, label);
    delContainer.x = (120 - label.getMeasuredWidth() - 10) / 2;
    this.container.addChild(delContainer)

    this.mouseOver(delContainer);
    delContainer.on("mousedown", () => this.desktop.activeObject.remove());
  }

  updateAlpha(alpha) {
    if (alpha < 0.01)
      alpha = 0.01;
    this.desktop.activeObject.backgroundAlpha = alpha;
    this.desktop.activeObject.redraw();
  }

  updateFont(font) {
    this.desktop.activeObject.font = font;
    this.desktop.activeObject.updateFontSize();
    this.desktop.activeObject.drawPlaceholder();
    this.desktop.activeObject.updateFontSize();
    this.highlightActiveItems();
  }

  updateFontStyle(style) {
    this.desktop.activeObject.style = style;
    this.desktop.activeObject.updateFontSize();
    this.desktop.activeObject.drawPlaceholder();
    this.desktop.activeObject.updateFontSize();
    this.highlightActiveItems();
  }

  updateFontSize(fontSize) {
    this.desktop.activeObject.fontSize = fontSize;
    this.desktop.activeObject.updateFontSize();
    this.desktop.activeObject.drawPlaceholder();
    this.desktop.activeObject.updateFontSize();
    this.highlightActiveItems();
  }

  updateStrokeWidth(sw) {
    this.desktop.activeObject.strokeWidth = sw;
    this.update()
  }

  updateStrokeType(st) {
    this.desktop.activeObject.strokeStyle = st;
    this.update()
  }

  updateHeadCount(hc) {
    this.desktop.activeObject.numberHeads = hc;
    this.update()
  }

  updateColor(color) {
    this.desktop.activeObject.color = color;
    if (this.desktop.activeObject.backgroundColor)
      this.desktop.activeObject.backgroundColor = color;
    this.update()
  }

  updateTextColor(textColor) {
    this.desktop.activeObject.textColor = textColor;
    this.desktop.activeObject.drawPlaceholder();
    this.highlightActiveItems();
  }

  update() {
    this.desktop.activeObject.redraw();
    this.highlightActiveItems();
  }

  highlightActiveItems() {
    let activeObject = this.desktop.activeObject;
    let highlightList = this.highlightList;

    if (activeObject.shapeClassName == "Textfield") {
      activeObject.focus();
      activeObject.drawPlaceholder();
    }

    for (let i = 0; i < highlightList.length; i++) {
      highlightList[i].alpha = 0.01;
    }

    this.setActive(this.strokeWidthContainer, activeObject.strokeWidth / 2)
    this.setActive(this.fontContainer, activeObject.fontSize / 1.5);
    this.setActive(this.strokeStyleContainer, activeObject.strokeStyle);
    this.setActive(this.headCountContainer, activeObject.numberHeads);
    this.setActive(this.textColorContainer, activeObject.textColor);
    this.setActive(this.fontContainer, activeObject.font);
    this.setActive(this.fontSizeContainer, activeObject.fontSize);
    this.setActive(this.fontStyleContainer, activeObject.style);

    let color;
    if (activeObject.shapeClassName == "Textfield") {
      color = activeObject.backgroundColor;
    } else {
      color = activeObject.color;
    }
    this.setActive(this.colorContainer, color);

    if (activeObject.alphaContainer) {
      this.setPosAlphaPicker(activeObject.backgroundAlpha)
    }
  }

  setActive(container, value) {
    if (container) {
      if (container[value])
        container[value].highlight.alpha = 1;
    }
  }

  drawStrokeItem(strokeWidth, yPos) {
    let menuItem = new createjs.Container();
    this.strokeWidthContainer[strokeWidth] = menuItem;

    let line = new createjs.Shape();
    line.graphics.setStrokeStyle(strokeWidth)
      .beginStroke("#000")
      .moveTo(5, (20) / 2)
      .lineTo(this.dialogWidth - 25, (20) / 2)
      .endStroke();

    this.drawBackground(menuItem, this.strokeWidthContainer, line)
    menuItem.y = yPos;

    menuItem.on("mousedown", () => this.updateStrokeWidth(strokeWidth * 2));
  }

  drawFontItem(font, yPos) {
    let menuItem = new createjs.Container();
    this.fontContainer[font] = menuItem;
    let label;
    if (font == "sans-serif") {
      label = new createjs.Text("Sans Serif", "12px sans-serif", "#000");
    } else {
      label = new createjs.Text("Serif", "12px serif", "#000");
    }

    this.drawBackground(menuItem, this.fontContainer, label)
    menuItem.y = yPos;
    label.x = 5;
    label.y = 3;

    menuItem.on("mousedown", () => this.updateFont(font));
  }

  drawFontStyleItem(style, yPos) {
    let menuItem = new createjs.Container();
    this.fontStyleContainer[style] = menuItem;
    let label;

    switch (style) {
      case "italic":
        label = new createjs.Text("Kursiv", "italic 12px sans-serif", "#000");
        break;
      case "bold":
        label = new createjs.Text("Fett", "bold 12px sans-serif", "#000");
        break;
      default:
        label = new createjs.Text("Normal", "12px sans-serif", "#000");
        break
    }
    this.drawBackground(menuItem, this.fontStyleContainer, label)

    menuItem.y = yPos;
    label.x = 5;
    label.y = 3;

    menuItem.on("mousedown", () => this.updateFontStyle(style));
  }

  drawStrokeTypeItem(strokeType, yPos) {
    let menuItem = new createjs.Container();
    this.strokeStyleContainer[strokeType] = menuItem;

    let line = new createjs.Shape();
    line.graphics.setStrokeStyle(this.medium)
    if (strokeType == 1) {
      line.graphics.setStrokeDash([12, 3]);
    }
    line.graphics.beginStroke("#000")
      .moveTo(5, (20) / 2)
      .lineTo(this.dialogWidth - 25, (20) / 2)
      .endStroke();

    this.drawBackground(menuItem, this.strokeStyleContainer, line);

    menuItem.y = yPos;
    menuItem.on("mousedown", () => this.updateStrokeType(strokeType));
  }

  drawColorItem(color, xPos) {
    let menuItem = new createjs.Container();
    this.colorContainer[color] = menuItem;

    let circle = new createjs.Shape();
    circle.graphics.setStrokeStyle(0)
      .beginFill(color)
      .drawCircle(0, 0, this.dialogWidth / 12);

    let hit = new createjs.Shape();
    hit.graphics.setStrokeStyle(2).beginStroke("#fff");
    hit.graphics.beginFill('#fff').drawCircle(0, 0, this.dialogWidth / 12 + 1);
    circle.hitArea = hit;
    hit.alpha = 1;

    menuItem.highlight = hit;
    menuItem.addChild(hit, circle);

    menuItem.y = 40;
    menuItem.x = xPos;
    this.colorContainer.addChild(menuItem);
    this.highlightList.push(hit)

    this.mouseOver(menuItem);
    menuItem.on("mousedown", () => this.updateColor(color));
  }

  drawTextColorItem(color, xPos) {
    let menuItem = new createjs.Container();
    this.textColorContainer[color] = menuItem;

    let circle = new createjs.Shape();
    circle.graphics.setStrokeStyle(0)
      .beginFill(color)
      .drawCircle(0, 0, this.dialogWidth / 12);

    let hit = new createjs.Shape();
    hit.graphics.setStrokeStyle(2).beginStroke("#fff");
    hit.graphics.beginFill('#fff').drawCircle(0, 0, this.dialogWidth / 12 + 1);
    circle.hitArea = hit;
    hit.alpha = 1;

    menuItem.highlight = hit;
    menuItem.addChild(hit, circle);

    menuItem.y = 40;
    menuItem.x = xPos;
    this.textColorContainer.addChild(menuItem);
    this.highlightList.push(hit)

    this.mouseOver(menuItem);
    menuItem.on("mousedown", () => this.updateTextColor(color));
  }

  drawFontSizeItem(size, xPos) {
    let menuItem = new createjs.Container();
    this.fontSizeContainer[size] = menuItem;
    let width = 25;

    let label = new createjs.Text("A", size/1.5 + "px sans-serif", "#000");
    let metrics = label.getTextMetrics();


    label.x = (width - metrics.width) / 2;
    label.y = (width - metrics.height) / 2;

    let rect = new createjs.Shape()
    rect.graphics.setStrokeStyle(0)
      .beginFill('#e3e3e3')
      .drawRect(0, 0, width, width);

    let hit = new createjs.Shape();
    hit.graphics.setStrokeStyle(3).beginStroke("#fff");
    hit.graphics.beginFill('#fff').drawRect(0, 0, 25, 25);
    rect.hitArea = hit;
    hit.alpha = 1;

    menuItem.highlight = hit;
    menuItem.addChild(hit, rect, label);

    menuItem.y = 40;
    menuItem.x = xPos;
    this.fontSizeContainer.addChild(menuItem);
    this.highlightList.push(hit)

    this.mouseOver(menuItem);
    menuItem.on("mousedown", () => this.updateFontSize(size));
  }

  drawHeadCountItem(headCount, yPos) {
    let menuItem = new createjs.Container();
    let arrowHolder = new createjs.Container();
    this.headCountContainer[headCount] = menuItem;
    menuItem.aH = arrowHolder;

    let line = new createjs.Shape();
    line.graphics.setStrokeStyle(this.medium)
      .beginStroke("#000")
      .moveTo(15, (20) / 2)
      .lineTo(this.dialogWidth - 35, (20) / 2)
      .endStroke();

    this.drawBackground(menuItem, this.headCountContainer, line)

    if (headCount >= 1) {
      let head = new createjs.Shape();
      head.graphics
        .beginFill('#000')
        .moveTo(10 / 2, 0)
        .lineTo(10, 10)
        .lineTo(0, 10)
        .lineTo(10 / 2, 0)
        .lineTo(10, 10)
        .endStroke();

      head.regX = 5;
      head.reg0Y = 5;
      head.y += 10;
      head.x = this.dialogWidth - 25;
      head.rotation = 90;
      arrowHolder.addChild(head)
    }
    if (headCount >= 2) {
      let head = new createjs.Shape();
      head.graphics
        .beginFill('#000')
        .moveTo(10 / 2, 0)
        .lineTo(10, 10)
        .lineTo(0, 10)
        .lineTo(10 / 2, 0)
        .lineTo(10, 10)
        .endStroke();

      head.regX = 5;
      head.reg0Y = 5;
      head.y += 10;
      head.x = 5;
      head.rotation = -90;
      arrowHolder.addChild(head)
    }
    arrowHolder.addChild(line);
    menuItem.y = yPos;
    menuItem.addChild(arrowHolder);
    menuItem.on("mousedown", () => this.updateHeadCount(headCount));
  }

  drawBackground(menuItem, container, c1) {
    let hit = new createjs.Shape();
    hit.graphics.setStrokeStyle(2)
      .beginStroke("#fff")
      .beginFill(this.backgroundColor)
      .drawRect(0, 0, this.dialogWidth - 20, 20);
    c1.hitArea = hit;
    hit.alpha = 0.01

    menuItem.highlight = hit;
    menuItem.x = this.paddingLeft;

    menuItem.addChild(hit, c1);
    container.addChild(menuItem);

    this.highlightList.push(hit);
    this.mouseOver(menuItem);
  }

  mouseOver(menuItem) {
    menuItem.addEventListener("mouseover", function () {
      menuItem.children[1].alpha = 0.7;
      menuItem.stage.update();
    })
    menuItem.addEventListener("mouseout", function () {
      menuItem.children[1].alpha = 1;
      menuItem.stage.update();
    })
  }

  setVisible(bool) {
    this.container.visible = bool;
    if (bool) {
      const factor = this.desktop.naturalScaleFactor;
      this.container.scaleX = factor.x;
      this.container.scaleY = factor.y;
      this.highlightActiveItems();
      this.stage.setChildIndex(this.container, this.stage.getNumChildren() - 1);
    }
  }

  isVisible() {
    return this.container.visible;
  }

  setPosition(x, y) {
    this.container.x = x;
    this.container.y = y;
    this.stage.update();
  }
}
