/*
 * $Id: audioplayer.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import SimpleShape from './simpleshape';
import MovableMixin from './movablemixin';
import Utils from './utils';


export default class AudioPlayer extends SimpleShape {
  get shapeClassName() { return "AudioPlayer"; }

  constructor(desktop, src, width, height, xval, yval, deletable, resizable, rotatable, regPoint, layer, pinable, adjustable) {
    super(desktop);
    this.width = width;
    this.conwidth = this.load("w", width);
    this.conheight = this.load("h", height);
    this.xval = this.load("x", xval);
    this.yval = this.load("y", yval);

    this.deletable = deletable;
    this.resizable = resizable;
    this.rotatable = rotatable;
    this.regPoint = regPoint;
    this.src = src;
    this._layer = layer;
    this.pinable = pinable;
    this.adjustable = adjustable;

    this.playing = false;
    this.sliderWidth = this.width - 135;
    this.playerBackgroundColor = "#000000";
    this.playerControlsColor = "#ffffff";
    this.playerProgressColor = "#1db4d8"
    this.controlsHeight = 40;
    this.currentTime = this.load("ct", 0);

    if (!this.src) {
      console.warn("Draggable: no src was supplied. Giving up.");
      return;
    }

    this.container.setBounds(0, 0, this.width, 50);
    this.audio = document.createElement('audio');

    this.audio.setAttribute("playsinline", "true");
    this.audio.setAttribute("crossorigin", "anonymous");

    if (!navigator.userAgent.match(/Edge\//))
      this.audio.setAttribute("autoplay", "true");

    this.audio.src = src;
    this.canplaythrough = false;

    this.audio.addEventListener("canplaythrough", () => {
      if (this.canplaythrough) return;
      this.canplaythrough = true;
      this.audio.currentTime = this.currentTime;
      this.audio.pause();
      this.startTime = this.load("st", 0);
      this.endTime = this.load("et", this.audio.duration);

      this.init();
    });

    this.audio.addEventListener("timeupdate", () => {
      // audio might be null during destruction
      if (this.audio) {
        this.currentTime = this.audio.currentTime;
      }
    });

  }


  drawControls() {
    const container = this.container;
    let controlsContainer = new createjs.Container();

    let playerFrame = new createjs.Shape();
    playerFrame.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, this.width, this.controlsHeight);
    playerFrame.alpha = 1;


    let sliderBack = new createjs.Shape();
    sliderBack.graphics
      .beginFill(this.playerControlsColor)
      .drawRect(this.controlsHeight, 0, this.sliderWidth, 3);

    let progressBack = new createjs.Shape();
    progressBack.graphics
      .beginFill("#504f4f")
      .drawRect(this.controlsHeight, 0, this.sliderWidth, 3);

    let sliderHandler = new createjs.Shape();
    sliderHandler.graphics
      .beginFill(this.playerProgressColor)
      .drawCircle(this.controlsHeight, 5, 7, 7);

    let rangeHeight = this.controlsHeight / 2;
    let offsetX = this.controlsHeight;

    let range1 = new createjs.Shape();

    range1.graphics
      .beginFill(this.playerControlsColor)
      .drawRoundRect(offsetX - rangeHeight / 2, 0, rangeHeight / 2, rangeHeight, 2, 2, 2, 2)
      .endStroke();

    let range2 = new createjs.Shape();
    range2.graphics
      .beginFill(this.playerControlsColor)
      .drawRoundRect(offsetX, 0, rangeHeight / 2, rangeHeight, 2, 2, 2, 2)
      .endStroke();

    let fontSize = '16px';
    let timeDisplay = new createjs.Text('00:00.00', `${fontSize} sans-serif`);
    timeDisplay.color = this.playerControlsColor;
    let metrics = timeDisplay.getTextMetrics();

    let progressBar = new createjs.Shape();

    let play = new createjs.Shape();
    this.drawPlay(play);

    this.playerFrame = playerFrame;
    this.progressBar = progressBar;
    this.progressBack = progressBack;
    this.sliderHandler = sliderHandler;
    this.timeDisplay = timeDisplay;
    this.sliderBack = sliderBack;

    controlsContainer.addChild(playerFrame, play, progressBack, sliderBack, progressBar, range1, range2, sliderHandler, timeDisplay)

    play.x = 10;
    play.y = (this.controlsHeight - 25) / 2;
    timeDisplay.x = this.width - 75;
    timeDisplay.y = (this.controlsHeight / 2) - metrics.height / 2;
    progressBack.y = sliderBack.y = progressBar.y = (this.controlsHeight - 3) / 2;

    sliderHandler.y = this.controlsHeight / 2 - 5;

    range2.x = this.sliderWidth;
    range1.y = range2.y = (this.controlsHeight - rangeHeight) / 2;
    this.range1 = range1;
    this.range2 = range2;
    this.slider = sliderHandler;

    play.on("mousedown", (e) => this.playSound(play));

    MovableMixin.attach(sliderHandler);
    MovableMixin.attach(range1);
    MovableMixin.attach(range2);
    sliderHandler.on("beginmove", () => this.startMove())
    sliderHandler.on("moving", (e) => {
      e.cancel();
      this.moveSlider(sliderHandler, progressBar, e.x, e.y)
    });
    sliderHandler.on("endmove", (e) => this.endMove());
    range1.on("beginmove", () => this.startMove())
    range1.on("moving", (e) => {
      e.cancel();
      this.moveRangeObject(range1, range1, range2, e.x, e.y)
    });
    range1.on("endmove", (e) => this.endMove());
    range2.on("beginmove", () => this.startMove())
    range2.on("moving", (e) => {
      e.cancel();
      this.moveRangeObject(range2, range1, range2, e.x, e.y)
    });
    range2.on("endmove", (e) => this.endMove());

    container.addChild(controlsContainer);
    container.controlsContainer = controlsContainer;
  }




  startMove() {
    this.focus();
  }

  endMove() {
    this.focus();
    this.desktop.update();
  }

  updateTime(timeDisplay) {
    let time = Utils.toHHMMSS(this.audio.currentTime, false);
    timeDisplay.text = time;
  }

  updateSliderBack(range1, range2) {
    let sliderBack = this.sliderBack;
    sliderBack.graphics.clear();

    let width = range2.x - range1.x;
    sliderBack.graphics
      .beginFill(this.playerControlsColor)
      .drawRect(this.controlsHeight + range1.x, 0, width, 3);
  }

  moveRangeObject(activeObject, range1, range2, x, y) {
    let container = this.container;

    let pt = activeObject.localToLocal(x, y, container.controlsContainer);
    let distance = Math.sqrt(Math.pow((pt.x - 0), 2) + Math.pow((pt.y - 0), 2));
    let maxDistance = this.sliderWidth;
    let angle = Math.cos(container.rotation * Math.PI / 180);

    let progressBar = this.progressBar;
    let sliderHandler = this.sliderHandler;


    if (distance <= maxDistance && pt.x >= 0) {
      if (range1.x <= range2.x) {
        activeObject.x += x / container.controlsContainer.scaleX / angle
      } else {
        if (activeObject == range1) {
          range1.x = range2.x
        } else {
          range2.x = range1.x
        }
      }
    }

    this.endTime = range2.x / maxDistance * this.audio.duration;
    this.startTime = range1.x / maxDistance * this.audio.duration;

    if (activeObject == range1) {
      sliderHandler.x = range1.x;
      this.audio.currentTime = this.startTime;
      progressBar.graphics.clear();
    } else if (activeObject == range2) {
      sliderHandler.x = range2.x;
      this.audio.currentTime = this.endTime;
      this.updateSlider(this.endTime / this.audio.duration)
    }

    if (activeObject.x < 0) { activeObject.x = 0; }
    if (activeObject.x > maxDistance) { activeObject.x = maxDistance - 1; }
    this.updateSliderBack(range1, range2);
    this.updateTime(this.timeDisplay)
    this.desktop.update()
  }

  moveSlider(slider, progressBar, x, y) {
    let container = this.container;

    let pt = slider.localToLocal(x, y, container.controlsContainer);

    let distance = Math.sqrt(Math.pow((pt.x - 0), 2) + Math.pow((pt.y - 0), 2));
    let maxDistance = this.sliderWidth;
    let angle = Math.cos(container.rotation * Math.PI / 180);

    if (distance < maxDistance && pt.x > this.range1.x) {
      slider.x += x / container.controlsContainer.scaleX / angle
    }

    if (slider.x <= this.range1.x) { slider.x = this.range1.x + 1; }
    if (slider.x >= this.range2.x) { slider.x = this.range2.x - 1; }

    let progress = slider.x / maxDistance;
    this.audio.currentTime = this.audio.duration * progress;
    this.updateSlider(progress);
    this.desktop.update()
  }

  updateSlider(percentage) {
    let progressBar = this.progressBar;
    let sliderHandler = this.sliderHandler;
    const maxWidth = this.sliderWidth;

    progressBar.graphics.clear();
    progressBar.graphics
      .beginFill(this.playerProgressColor)
      .drawRect(this.range1.x + this.controlsHeight, 0, maxWidth * percentage - this.range1.x, 3);
    sliderHandler.x = (maxWidth) * percentage;
    this.updateTime(this.timeDisplay);
  }

  drawPlay(play) {
    let hold = 25;
    play.graphics.clear();

    play.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, hold, hold);

    play.graphics
      .beginFill(this.playerControlsColor)
      .moveTo(0, 0)
      .lineTo(0, hold)
      .lineTo(hold / 2, hold / 2)
      .lineTo(0, 0)
      .lineTo(0, hold)
      .endStroke();
  }

  drawPause(play) {
    let hold = 25;
    play.graphics.clear();

    play.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, hold, hold);

    play.graphics
      .beginFill(this.playerControlsColor)
      .moveTo(0, 0)
      .lineTo(0, hold)
      .lineTo(5, hold)
      .lineTo(5, 0)
      .lineTo(0, 0)

      .moveTo(10, 0)
      .lineTo(10, hold)
      .lineTo(15, hold)
      .lineTo(15, 0)
      .lineTo(10, 0)
      .endStroke();
  }

  playSound(playButton) {

    let n1 = Math.round(this.audio.currentTime * 10) / 10;
    let n2 = Math.round(this.endTime * 10) / 10

    if (n1 == n2) {
      this.audio.currentTime = this.startTime;
    }

    if (this.playing == false) {
      this.drawPause(playButton)
      this.playing = true;
      this.audio.play();

      this.desktop.setTicker((off) => {
        const audio = this.audio;

        if (!audio) {
          off();
          return;
        }

        if (!this.playing) {
          return;
        }

        this.desktop.update();
        if (this.audio.currentTime < this.startTime) { this.audio.currentTime = this.startTime }
        this.updateSlider(audio.currentTime / audio.duration)
        if (audio.currentTime >= this.endTime) {
          this.playing = false;
          this.audio.pause();
          this.audio.currentTime = this.startTime
          this.drawPlay(playButton);
          off();
        }
      });

    } else {
      this.drawPlay(playButton)
      this.playing = false;
      this.audio.pause();
      this.desktop.update()
    }
  }

  create() {
    const container = this.container;
    this.drawControls();
    let ratio = container.getBounds().width / container.getBounds().height;

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
    container.x = this.xval;
    container.y = this.yval;

    this.desktop.update();
  }

  resizeBy(evt) {
    const container = this.container;
    let controlsContainer = container.controlsContainer;
    const minWidth = 180;

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

    let distanceX = container.cwidth + px;
    let distanceY = container.cheight + py;

    let startWidth = container.getBounds().width;
    let startHeight = container.getBounds().height;

    if (distanceX > distanceY && distanceX > minWidth) {
      container.cwidth = distanceX;
      container.cheight = startHeight * controlsContainer.scaleX;

    } else if (distanceY > distanceX && distanceY > minWidth) {
      container.cheight = distanceY;
      container.cwidth = startWidth * controlsContainer.scaleY;
    }
    this.resizeControls();

  }

  resizeControls() {
    const container = this.container;
    let playerFrame = this.playerFrame;
    let timeDisplay = this.timeDisplay;
    let progressBack = this.progressBack;


    playerFrame.graphics.clear();
    playerFrame.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, container.cwidth, this.controlsHeight);

    timeDisplay.x = container.cwidth - 75;
    this.sliderWidth = container.cwidth - 135;

    progressBack.graphics.clear();
    progressBack.graphics
      .beginFill("#504f4f")
      .drawRect(this.controlsHeight, 0, this.sliderWidth, 3);


    this.range2.x = (this.endTime / this.audio.duration) * this.sliderWidth;
    this.range1.x = (this.startTime / this.audio.duration) * this.sliderWidth;

    this.updateSliderBack(this.range1, this.range2)
    this.updateSlider(this.audio.currentTime / this.audio.duration)

  }

  get layer() {
    return this._layer;
  }

  onFocus() {
    super.onFocus();

  }

  onBlur() {
    super.onBlur();

  }

  remove() {
    if (this.audio) {
      this.audio.pause();
      this.audio.remove();
      this.audio = null;
    }
    super.remove();
  }

  persist() {
    super.persist();
    this.store("ct", this.currentTime);
    this.store("st", this.startTime);
    this.store("et", this.endTime);
  }
}
