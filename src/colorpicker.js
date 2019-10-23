/*
 * $Id: colorpicker.js 42006 2017-07-12 23:01:00Z robertj $
 */

import { createjs } from 'EaselJS';
import Utils from './utils';

export default class ColorPicker {
  constructor(desktop) {
    this.desktop = desktop;
  }

  show(size) {
    if (this.active) return;

    this.active = true;
    let stage = this.desktop.stage;
    let canvas = stage.canvas;
    let oldCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";


    let background = new createjs.Container();
    let rect = new createjs.Shape();
    rect.graphics
      .beginFill("rgba(0,0,0,0.1)")
      .drawRect(0, 0, this.desktop.width, this.desktop.height);

    background.addChild(rect);
    stage.addChild(background);
    stage.background = background;
    stage.update();

     const downWrapper = background.on("click", (e) => {
      this.active = false;
      background.off("click", downWrapper);
      stage.removeChild(background);
      stage.update();

      e.preventDefault();
      canvas.style.cursor = oldCursor;

      let x = e.stageX;
      let y = e.stageY;
      let ctx = canvas.getContext("2d");
      let data = ctx.getImageData(x, y, 1, 1).data;
      let color = Utils.toHtmlColor(data[0], data[1], data[2]);

      // unscale
      x = x / stage.scaleX;
      y = y / stage.scaleY;

      let rect = this.desktop.factory.createRectangle({
        persist: true,
        width: size || 40,
        x: x,
        y: y,
        color: color,
        backgroundColor: color,
        backgroundAlpha: 1,
        strokeWidth: 2,
        rotatable: false
      });
      rect.created.then(() => rect.focus());
    });
  }
}
