/*
 * $Id: player.js 46567 2018-10-05 20:28:29Z robertj $
 */

import { createjs } from 'EaselJS';
import SimpleShape from './simpleshape';
import MovableMixin from './movablemixin';
import Utils from './utils';

export default class Player extends SimpleShape {
  get shapeClassName() { return "Player"; }

  constructor(desktop, src, width, height, xval, yval, labelText, labelColor, deletable, resizable, rotatable, regPoint, layer, pinable, adjustable) {
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
    this.adjustable = adjustable;

    this.playing = false;
    this.playerBackgroundColor = "#000000";
    this.playerControlsColor = "#ffffff";
    this.playerProgressColor = "#1db4d8";
    this.controlsHeight = 40;
    this.currentTime = this.load("ct", 0);


    if (!this.src) {
      console.warn("Draggable: no src was supplied. Giving up.");
      return;
    }

    this.video = document.createElement('video');
    this.video.setAttribute("playsinline", "true");
    // FIXME: only iOS (and maybe Android) is actually needing autoplay.
    // Under Edge, autoplay is too slow, so we don't set it.
    if (!navigator.userAgent.match(/Edge\//))
      this.video.setAttribute("autoplay", "true");
    this.video.setAttribute("crossorigin", "anonymous");
    this.video.src = src;
    this.canplaythrough = false;

    this.video.addEventListener("canplaythrough", () => {
      if (this.canplaythrough) return;
      this.canplaythrough = true;
      this.video.currentTime = this.currentTime;
      this.video.pause();
      this.originalWidth = this.video.videoWidth;
      this.originalHeight = this.video.videoHeight;
      this.sliderWidth = this.originalWidth - 195;
      this.bitmap = new createjs.Bitmap(this.video);
      this.bitmap.setBounds(0, 0, this.originalWidth, this.originalHeight);
      this.init();

      this.video.addEventListener("timeupdate", () => {
        // video might be null during destruction
        if (this.video) {
          this.currentTime = this.video.currentTime;
          this.desktop.update();
        }
      })
    });
  }

  remove() {
    if (this.video) {
      this.playing = false;
      this.video.pause();
      this.video.remove();
      this.video = null;
    }
    super.remove();
  }

  drawControls() {
    const container = this.container;
    let controlsContainer = new createjs.Container();

    let playerFrame = new createjs.Shape();
    playerFrame.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, this.originalWidth, this.controlsHeight);
    playerFrame.alpha = 1;


    let sliderBack = new createjs.Shape();
    sliderBack.graphics
      .beginFill(this.playerControlsColor)
      .drawRect(0, 0, this.sliderWidth, 3);


    let sliderHandler = new createjs.Shape();
    sliderHandler.graphics
      .beginFill(this.playerProgressColor)
      .drawCircle(40, 5, 7, 7);

    let fontSize = '16px';
    let timeDisplay = new createjs.Text('00:00.00', `${fontSize} sans-serif`);
    timeDisplay.color = this.playerControlsColor;
    let metrics = timeDisplay.getTextMetrics();

    let progressBar = new createjs.Shape();
    let camera = new createjs.Shape();
    let play = new createjs.Shape();
    this.drawPlay(play);
    this.drawCamera(camera);
    play.on("mousedown", (e) => this.playVideo(play));
    camera.on("mousedown", (e) => this.onSnapshot());

    controlsContainer.playerFrame = playerFrame;
    controlsContainer.progressBar = progressBar;
    controlsContainer.sliderHandler = sliderHandler;
    controlsContainer.timeDisplay = timeDisplay;
    controlsContainer.camera = camera;
    controlsContainer.sliderBack = sliderBack;

    controlsContainer.addChild(playerFrame)
    controlsContainer.addChild(play, sliderBack, progressBar, sliderHandler, timeDisplay, camera)

    play.x = 10;
    camera.y = play.y = (this.controlsHeight - 25) / 2;
    timeDisplay.y = this.controlsHeight / 2 - metrics.height / 2;
    camera.x = this.originalWidth - this.controlsHeight;
    camera.scaleX = camera.scaleY = 0.83;
    sliderBack.x = 40;
    sliderBack.y = progressBar.y = (this.controlsHeight - 3) / 2;
    sliderHandler.x = 0;
    sliderHandler.y = this.controlsHeight / 2 - 5;

    container.addChild(controlsContainer);
    container.controlsContainer = controlsContainer;

    MovableMixin.attach(sliderHandler);
    sliderHandler.on("beginmove", () => this.focus());
    sliderHandler.on("moving", (e) => {
      e.cancel();
      this.moveSlider(sliderHandler, progressBar, e.x, e.y)
    });
    sliderHandler.on("endmove", (e) => this.focus());
  }

  updateTime(timeDisplay) {
    let time = Utils.toHHMMSS(this.video.currentTime, false);
    timeDisplay.text = time;
  }

  //ToDo: Video vanishes whole moving the slider.
  moveSlider(slider, progressBar, x, y) {
    let container = this.container;

    let pt = slider.localToLocal(x, y, container.controlsContainer);
    let distance = Math.sqrt(Math.pow((pt.x - 0), 2) + Math.pow((pt.y - 0), 2));
    let maxDistance = this.sliderWidth;
    let angle = Math.cos(container.rotation * Math.PI / 180);

    if (distance < maxDistance && pt.x > 0) {
      slider.x += x / container.controlsContainer.scaleX / angle
    }

    if (slider.x <= 0) { slider.x = 2; }
    if (slider.x >= maxDistance) { slider.x = maxDistance - 2; }

    let progress = slider.x / maxDistance;
    this.video.currentTime = this.video.duration * progress;
    this.updateSlider(progress);
    this.desktop.update()
  }

  updateSlider(percentage) {
    const controlsContainer = this.container.controlsContainer;
    let progressBar = controlsContainer.progressBar;
    let sliderHandler = controlsContainer.sliderHandler;

    progressBar.graphics.clear();
    progressBar.graphics
      .beginFill(this.playerProgressColor)
      .drawRect(40, 0, this.sliderWidth * percentage, 3);

    sliderHandler.x = percentage * this.sliderWidth;
    this.updateTime(controlsContainer.timeDisplay);
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

  playVideo(playButton) {
    if (this.playing == false) {

      this.drawPause(playButton)
      this.playing = true;
      this.video.play();

      this.desktop.setTicker((off) => {
        const video = this.video;

        if (!video) {
          off();
          return;
        }

        if (!this.playing) {
          return;
        }

        this.desktop.update();
        this.updateSlider(video.currentTime / video.duration)
        if (video.currentTime >= video.duration) {
          this.playing = false;
          this.drawPlay(playButton);
          off();
        }
      });

    } else {
      this.drawPlay(playButton)
      this.playing = false;
      this.video.pause();
      this.desktop.update()
    }
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

    this.drawControls();

    container.x = this.xval;
    container.y = this.yval;
    container.controlsContainer.x = 0;
    container.controlsContainer.y = container.cheight;
  }

  resizeControls() {
    const container = this.container;
    let controls = container.controlsContainer;
    let playerFrame = controls.playerFrame;
    let sliderBack = controls.sliderBack;
    let timeDisplay = controls.timeDisplay;
    let camera = controls.camera;

    playerFrame.graphics.clear();
    playerFrame.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, container.cwidth, this.controlsHeight);

    timeDisplay.x = container.cwidth - 110;
    camera.x = container.cwidth - this.controlsHeight;

    this.sliderWidth = container.cwidth - 160;

    sliderBack.graphics.clear();
    sliderBack.graphics
      .beginFill(this.playerControlsColor)
      .drawRect(0, 0, this.sliderWidth, 3);
    this.updateSlider(this.video.currentTime / this.video.duration)
  }


  resizeBy(evt) {

    const container = this.container;
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

    let bounds = this.bitmap.getBounds();
    let startWidth = bounds.width;
    let startHeight = bounds.height;


    if (distanceX > distanceY && distanceX > minWidth) {

      this.image.scaleX = distanceX / startWidth;
      this.image.scaleY = distanceX / startWidth;
      container.cwidth = distanceX;
      container.cheight = startHeight * this.image.scaleX;

    } else if (distanceX < distanceY && distanceY > minWidth) {

      this.image.scaleX = (distanceY / startHeight);
      this.image.scaleY = distanceY / startHeight;
      container.cheight = distanceY;
      container.cwidth = startWidth * this.image.scaleY;
    }

    if (container.children[0].scaleX < 0) {
      this.image.x = container.cwidth;
      this.image.y = 0;
    } else {
      this.image.x = 0;
      this.image.y = 0;
    }

    this.alignLabel();
    this.resizeControls();

    container.controlsContainer.x = 0;
    container.controlsContainer.y = container.cheight - 1;


  }



  drawCamera(camera) {
    camera.graphics
      .beginFill(this.playerBackgroundColor)
      .drawRect(0, 0, 33, 30);

    camera.graphics
      .beginFill(this.playerControlsColor)
      .moveTo(19.255, 0)
      .lineTo(13.753, 0)
      .bezierCurveTo(12.727, 0, 11.786, 0.188, 10.934000000000001, 0.563)
      .bezierCurveTo(10.082000000000003, 0.938, 9.416, 1.397, 8.939, 1.938)
      .bezierCurveTo(8.462, 2.479, 8.059, 3.02, 7.729, 3.561)
      .bezierCurveTo(7.399000000000001, 4.102, 7.1690000000000005, 4.5649999999999995, 7.041, 4.951)
      .lineTo(6.876, 5.5009999999999994)
      .lineTo(2.75, 5.5009999999999994)
      .bezierCurveTo(1.998, 5.5009999999999994, 1.352, 5.771999999999999, 0.8109999999999999, 6.313)
      .bezierCurveTo(0.2699999999999998, 6.854, 0, 7.5, 0, 8.252)
      .lineTo(0, 24.756)
      .bezierCurveTo(0, 25.508, 0.27, 26.154, 0.811, 26.695)
      .bezierCurveTo(1.352, 27.236, 1.999, 27.507, 2.75, 27.507)
      .lineTo(30.258, 27.507)
      .bezierCurveTo(31.009999999999998, 27.507, 31.656, 27.236, 32.197, 26.695)
      .bezierCurveTo(32.73800000000001, 26.154, 33.009, 25.507, 33.009, 24.756)
      .lineTo(33.009, 8.252)
      .bezierCurveTo(33.009, 7.500000000000001, 32.738, 6.854000000000001, 32.197, 6.313000000000001)
      .bezierCurveTo(31.656000000000006, 5.772, 31.009000000000004, 5.501, 30.258000000000003, 5.501)
      .lineTo(26.132, 5.501)
      .bezierCurveTo(26.095000000000002, 5.355, 26.035, 5.157, 25.953000000000003, 4.909000000000001)
      .bezierCurveTo(25.870000000000005, 4.662000000000001, 25.650000000000002, 4.221000000000001, 25.293000000000003, 3.5890000000000004)
      .bezierCurveTo(24.935000000000002, 2.9570000000000003, 24.522000000000002, 2.3980000000000006, 24.055000000000003, 1.9110000000000005)
      .bezierCurveTo(23.587000000000003, 1.4260000000000006, 22.927000000000003, 0.9850000000000004, 22.075000000000003, 0.5910000000000004)
      .bezierCurveTo(21.223000000000003, 0.1970000000000004, 20.281, 0, 19.255, 0)

      .moveTo(8.252, 8.252)
      .lineTo(8.252, 11.003)
      .lineTo(5.501, 11.003)
      .lineTo(5.501, 8.252)
      .lineTo(8.252, 8.252)

      .moveTo(16.504, 10.178)
      .bezierCurveTo(18.246000000000002, 10.178, 19.736, 10.596000000000001, 20.974, 12.034)
      .bezierCurveTo(22.212, 13.271, 22.831, 14.762, 22.831, 16.504)
      .bezierCurveTo(22.831, 18.246000000000002, 22.212, 19.736, 20.974, 20.974)
      .bezierCurveTo(19.737000000000002, 22.212, 18.246, 22.831, 16.504, 22.831)
      .bezierCurveTo(14.762000000000004, 22.831, 13.272000000000002, 22.212, 12.034000000000002, 20.974)
      .bezierCurveTo(10.596000000000003, 19.737000000000002, 10.178000000000003, 18.246, 10.178000000000003, 16.504)
      .bezierCurveTo(10.178000000000003, 14.762000000000004, 10.596000000000003, 13.272000000000002, 12.034000000000002, 12.034000000000002)
      .bezierCurveTo(13.271, 10.596, 14.762, 10.178, 16.504, 10.178)

      .moveTo(16.504, 13.671)
      .bezierCurveTo(15.716000000000001, 13.671, 15.046000000000001, 13.945, 14.496000000000002, 14.495999999999999)
      .bezierCurveTo(13.945000000000002, 15.046, 13.671000000000003, 15.716, 13.671000000000003, 16.503999999999998)
      .bezierCurveTo(13.671000000000003, 17.293, 13.945000000000004, 17.961999999999996, 14.496000000000002, 18.511999999999997)
      .bezierCurveTo(15.046000000000003, 19.062999999999995, 15.716000000000003, 19.336999999999996, 16.504, 19.336999999999996)
      .bezierCurveTo(17.293000000000003, 19.336999999999996, 17.962, 19.062999999999995, 18.512, 18.511999999999997)
      .bezierCurveTo(19.063, 17.961999999999996, 19.337, 17.292999999999996, 19.337, 16.503999999999998)
      .bezierCurveTo(19.337, 15.715999999999998, 19.063, 15.045999999999998, 18.512, 14.495999999999999)
      .bezierCurveTo(17.962, 13.945, 17.293, 13.671, 16.504, 13.671)

      .endStroke();
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

  onFocus() {
    super.onFocus();
    this.alignLabel();
  }

  onBlur() {
    super.onBlur();
    this.alignLabel();
  }

  /**
   * Gets the position of the expander of this shape.
   */
  get expanderPos() {
    let pos = super.expanderPos;
    pos.y += this.controlsHeight;
    return pos;
  }

  /**
   * Gets the position of the pinner of this shape.
   */
  get pinnerPos() {
    let pos = super.pinnerPos;
    pos.y += this.controlsHeight;
    return pos;
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

  /**
   * Captures a screenshot of the video and returns its data URL.
   */
  capture(preferredWidth = 0, type = 'image/jpeg', quality = 0.9) {
    if (preferredWidth == 0)
      preferredWidth = this.video.videoWidth;

    const canvas = document.createElement("canvas");
    const width = canvas.width = preferredWidth;
    const height = canvas.height = preferredWidth / (this.video.videoWidth / this.video.videoHeight);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.video, 0, 0, width, height);
    // FIXME: under iOS, the first drawImage call might not return the current
    // frame, so we retry.
    if (!this.capturedOnce) {
      this.capturedOnce = true;
      ctx.drawImage(this.video, 0, 0, width, height);
    }
    return canvas.toDataURL(type, quality);
  }

  /**
   * Returns video's current time as a string.
   */
  getCurrentTimeLabel() {
    return Utils.toHHMMSS(this.video.currentTime, false);
  }

  /**
   * Emits the 'player:snapshot' event on the desktop that contains
   * this player. The event args include the player object keyed by
   * 'player'.
   */
  onSnapshot() {
    this.desktop.dispatchEvent({
      type: 'player:snapshot',
      player: this
    });
  }

  persist() {
    super.persist();
    this.store("ct", this.currentTime);
  }
}
