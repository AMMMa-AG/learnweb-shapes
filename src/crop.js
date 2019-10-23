/*
 * $Id$
 */

import { createjs } from 'EaselJS';

export default class Crop {
  constructor(desktop) {
    this.desktop = desktop;
    this.active = false;

  }

  show(type) {

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
      .beginFill("rgba(0,0,0,0.1)")
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

      if (type == 1) {
        cropRectangle();
      } else {
        cropFreehand();
      }


      function cropFreehand() {

        points.push({
          x: evt.stageX / stage.scaleX,
          y: evt.stageY / stage.scaleY
        });

        if (points.length == 1) return;

        outline.graphics
          .clear()
          .beginFill("rgba(0,255,0,0.2)")
          .beginStroke("#666666")
          .setStrokeDash([7, 12])
          .setStrokeStyle(2, "round");

        outline.graphics
          .moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length; i++) {
          outline.graphics
            .lineTo(points[i].x, points[i].y)
        }

        outline.graphics
          .lineTo(points[0].x, points[0].y)
      }


      function cropRectangle() {

        points.splice(1, points.length)

        points.push({
          x: evt.stageX / stage.scaleX,
          y: evt.stageY / stage.scaleY
        });

        if (points.length == 1) return;

        outline.graphics
          .clear()
          .beginFill("rgba(0,255,0,0.2)")
          .beginStroke("#666666")
          .setStrokeDash([7, 12])
          .setStrokeStyle(2, "round");

        if (points.length == 2) {
          outline.graphics
            .moveTo(points[0].x, points[0].y)
            .lineTo(points[0].x, points[1].y)
            .lineTo(points[1].x, points[1].y)
            .lineTo(points[1].x, points[0].y)
            .lineTo(points[0].x, points[0].y)
        }


        let rectPoints = [{ x: points[0].x, y: points[0].y },
        { x: points[0].x, y: points[1].y },
        { x: points[1].x, y: points[1].y },
        { x: points[1].x, y: points[0].y }];


        points = rectPoints;

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

      // we need more than 2 points to continue
      if (points.length < 2) return;

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
      let cropCtx = cropCanvas.getContext("2d");
      cropCanvas.width = width;
      cropCanvas.height = height;

      // draw cropPath
      cropCtx.beginPath();
      cropCtx.moveTo(points[0].x - minw, points[0].y - minh)
      for (let i = 1; i < points.length; i++) {
        cropCtx.lineTo(points[i].x - minw, points[i].y - minh);
      }
      cropCtx.lineTo(points[0].x - minw, points[0].y - minh);
      cropCtx.clip();

      // copy image from stage's canvas to cropCanvas
      cropCtx.drawImage(canvas, minw, minh, width, height, 0, 0, width, height);

      // canvas to Draggable
      let drag = this.desktop.factory.createDraggable({
        persist: true,
        path: cropCanvas.toDataURL(),
        width: 0,
        x: 10 + (minw + (maxw - minw) / 2) / stage.scaleX,
        y: 10 + (minh + (maxh - minh) / 2) / stage.scaleY
      });
      drag.created.then(() => drag.focus());
    });
  }
}
