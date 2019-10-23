/*
 * $Id: timeline.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';



export default class Timeline extends Shape {
  get shapeClassName() { return "Timeline"; }

  constructor(desktop, width, height, xval, yval, startSec, sec, increment, timelineColor, backgroundColor) {
    super(desktop);
    this.width = width;
    this.height = height;
    this.xval = xval;
    this.yval = yval;
    this.startSec = startSec;
    this.sec = sec;
    this.increment = increment;
    this.backgroundColor = backgroundColor;
    this.timelineColor = timelineColor;
    this.init();
  }

  get layer() {
    return Shape.BackgroundLayer;
  }

  create() {

    let padding = 30;

    const container = this.container;
    let dist = (this.width - padding * 2) / (this.sec - this.startSec);


    const background = new createjs.Shape()
    background.graphics.beginFill(this.backgroundColor).drawRect(0, -padding, this.width, this.height + padding * 2);
    container.addChild(background);

    const horizonzal = new createjs.Shape()
    horizonzal.graphics.setStrokeStyle(1).beginStroke(this.timelineColor).moveTo(padding, this.height).lineTo(this.width - padding, this.height);
    container.addChild(horizonzal);

    // get the computed font size from the canvas' DOM element
    let fontSize = this.desktop.fontSize || '14px';

    for (let i = this.startSec; i <= this.sec; i = i + this.increment) {
      let line = new createjs.Shape()
      let x = padding + (i - this.startSec) * dist;

      if (i % 10 == 0) {
        line.graphics.setStrokeStyle(1)
          .beginStroke(this.timelineColor)
          .moveTo(x, this.height)
          .lineTo(x, this.height / 2);

        let time = new createjs.Text("", `${fontSize} sans-serif`, this.timelineColor);

        time.text = Math.floor(i / 60) + ":" + (i % 60 || "00");
        time.x = x - time.getMeasuredWidth() / 2;
        time.y = - time.getMeasuredHeight() / 2
        container.addChild(time);

      } else if (i % this.increment == 0) {
        line.graphics.setStrokeStyle(1)
          .beginStroke(this.timelineColor)
          .moveTo(x, this.height)
          .lineTo(x, this.height - this.height / 4);
      }



      container.addChild(line)
      container.mouseEnabled = false;
      container.x = this.xval;
      container.y = this.yval - 10;
    }
  }

  focus() {
    // noop
  }

  blur() {
    // noop
  }
}
