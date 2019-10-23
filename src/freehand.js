/*
 * $Id$
 */

import { createjs } from 'EaselJS';

export default class Freehand {
  constructor(desktop) {
    this.desktop = desktop;
    this.active = false;
  }

  show(color, strokeWidth) {
    if (this.active) return;
    this.active = true;

    let stage = this.desktop.stage;
    let canvas = stage.canvas;
    let oldCursor = canvas.style.cursor;
    let points = [];
    canvas.style.cursor = "crosshair";

    // create a container and a filled rectangle for the background
    // so we can attract all events to us.
    let background = new createjs.Container();
    let rect = new createjs.Shape();
    rect.graphics
      .beginFill("rgba(0,0,0,0.01)")
      .drawRect(0, 0, this.desktop.width, this.desktop.height);
    background.addChild(rect);
    stage.addChild(background);
    let outline = new createjs.Shape();
    background.addChild(outline);
    stage.update();

    //
    // move
    //
    const moveWrapper = background.on("pressmove", (evt) => {
      // kill native event

      evt.nativeEvent.preventDefault();
      if (!this.active) return;

        points.push({
        x: evt.stageX / stage.scaleX,
        y: evt.stageY / stage.scaleY
      });

      outline.graphics
        .clear()
        .beginStroke(color)
        .setStrokeStyle(strokeWidth);

      for (let i = 0; i < points.length; i++) {
        outline.graphics
          .lineTo(points[i].x, points[i].y)
    }

    stage.update();

    });

    //
    // up
    //
    const upWrapper = background.on("pressup", (e) => {
      this.active = false;

      // clean up
      background.off("pressmove", moveWrapper);
      background.off("pressup", upWrapper);
      stage.removeChild(background);
      stage.update();
      canvas.style.cursor = oldCursor;

      // scale the points back because they were unscaled in "pressmove"
      for (let p of points) {
        p.x = p.x * stage.scaleX;
        p.y = p.y * stage.scaleY;
      }

      let minw = points.min((p) => p.x);
      let maxw = points.max((p) => p.x);
      let minh = points.min((p) => p.y);
      let maxh = points.max((p) => p.y);

      let width = Math.floor(maxw - minw);
      let height = Math.floor(maxh - minh);

      // create a temporary canvas
      let cropCanvas = document.createElement("canvas");
      let tmpCtx = cropCanvas.getContext("2d");
      cropCanvas.width = width+strokeWidth*2;
      cropCanvas.height = height+strokeWidth*2;

      // draw path on canvas
      tmpCtx.beginPath();
      tmpCtx.lineWidth=strokeWidth * stage.scaleX;
      tmpCtx.strokeStyle=color;

      for (let i = 0; i < points.length; i++) {
        tmpCtx.lineTo((points[i].x - minw+strokeWidth), (points[i].y - minh)+strokeWidth);
      }
      tmpCtx.stroke();

      // canvas to Draggable
      let drag = this.desktop.factory.createDraggable({
        persist: true,
        path: cropCanvas.toDataURL(),
        width: 0,
        rotatable: false,
        resizable: false,
        layer: 2,
        x: (minw + (maxw - minw) / 2) / stage.scaleX,
        y: (minh + (maxh - minh) / 2) / stage.scaleY
      });
      drag.created.then(() => drag.focus());
    });
  }
}
