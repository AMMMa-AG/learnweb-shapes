/*
 * $Id: desktop.js 48675 2019-09-12 12:11:41Z robertj $
 */

import {
  createjs
} from 'EaselJS';
// As TweenJS uses the same "createjs" namespace, import it nameless.
import 'TweenJS';
import Shape from './shape';
import MovableMixin from './movablemixin';
import Storage from './storage';
import throttle from 'lodash/throttle';
import forOwn from 'lodash/forOwn';
import Dropzone from 'dropzone';
import 'dropzone/dist/dropzone.css';
import ContextMenu from './contextmenu';
Dropzone.autoDiscover = false;

const isAndroid = navigator.userAgent.match(/Android/i);
const isFirefox = navigator.userAgent.match(/Firefox/i);

export default class Desktop {
  constructor(factory, stage, fitParent = false, designWidth = 0, version = 0, storagePrefix = '') {
    this.factory = factory;
    this.stage = stage;
    this.version = version;
    this.uid = 0;
    this.id = this.getUID();
    // set the storage ID either from <canvas data-storage-prefix>,
    // or from <canvas id>.
    // the first must be unique per document (DOM rule), while the latter
    // may be used more than once to display the same data on different
    // canvases.
    let storageId = this.stage.canvas.dataset.storagePrefix ||
      storagePrefix + this.version + this.stage.canvas.id + "s";
    this.storage = new Storage(storageId);
    this.indexes = this.load(this, "I", []);
    this.promises = [];
    this.shapeById = new Map();
    this.drawDeleter();
    this.drawExpander();
    this.drawRotator();
    this.drawPinner();
    this.drawMirrorIcon();
    this.drawSettings();

    // context menus
    this.contextMenu = new ContextMenu(this);
    this.contextMenu.drawContextMenu();
    this.arrowContextMenu = new ContextMenu(this);
    this.arrowContextMenu.drawArrowContextMenu();
    this.textContextMenu = new ContextMenu(this);
    this.textContextMenu.drawTextContextMenu();

    this.stage.enableMouseOver(20);

    // don't globally block native events so the canvas can be used to
    // scroll the page on a tablet. however, we must call
    // e.nativeEvent.preventDefault() for each event we don't want
    // to reach outside the canvas.
    // see https://lucentminds.com/archives/easeljs-touch-mouse-events.html
    this.stage.preventSelection = false;
    createjs.Touch.enable(this.stage, false, true);

    // initialize Ticker
    createjs.Ticker.framerate = 30;
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    this.tickerDepth = 0;
    this.tickerHandler = createjs.Ticker.on("tick", (e) => {
      // emit event for Desktop.setTicker()
      this.dispatchEvent({
        type: "desktoptick",
        tickerArgs: e
      });
      // update only when requested
      if (this.tickerDepth > 0) {
        this.stage.update();
      }
    });

    // hook misc events
    this.stage.on("stagemousedown", this.stageMousedown.bind(this));
    this.stage.on("drawend", throttle(this.persist.bind(this), 1000));

    // initialize layers
    this.backgroundLayer = new createjs.Container();
    this.imageLayer = new createjs.Container();
    this.toolLayer = new createjs.Container();
    this.stage.addChild(this.backgroundLayer, this.imageLayer, this.toolLayer);

    //
    // FIXME: the device pixel ratio stuff is coupled to the fitParent
    // option. No fitParent => no device pixel scale-up.
    //
    // stage.pixelRatio is exposed to extensions which don't know
    // about our Desktop (see extensions/createjs.js).
    //
    this.pixelRatio = stage.pixelRatio = 1;

    if (fitParent) {
      this.pixelRatio = stage.pixelRatio = window.devicePixelRatio || 1;
      let initialHeight = stage.canvas.height;
      let initialScaleX = stage.scaleX;
      let initialScaleY = stage.scaleY;

      $(window).on('resize orientationchange', (event, manualInvocation) => {
        // abort when the canvas or its ancestors are hidden
        if ($(stage.canvas).is(':hidden'))
          return;

        let pr = this.pixelRatio;
        let width = stage.canvas.parentNode.offsetWidth;
        stage.canvas.width = width * pr;
        stage.canvas.style.width = width + "px";

        if (designWidth) {
          let factor = width / designWidth;
          stage.scaleX = pr * factor;
          stage.scaleY = pr * factor;
          stage.canvas.height = pr * initialHeight * factor;
          stage.canvas.style.height = initialHeight * factor;
        } else {
          stage.canvas.height = pr * initialHeight;
          stage.canvas.style.height = initialHeight;
          stage.scaleX = pr * initialScaleX;
          stage.scaleY = pr * initialScaleY;
        }

        // blur and signalize that we're in 'resize' if appropriate.
        try {
          this.blurDuringResize = manualInvocation ? false : true;
          this.blur();
        } finally {
          this.blurDuringResize = false;
        }

        stage.update();
        this.dispatchEvent("desktopresize");
      });

      // invoke 'resize' handler manually
      $(window).triggerHandler('resize', 1);
    }
  }

  /**
   * Sets a fake pixel ratio for testing purposes.
   *
   * @param {number} ratio
   */
  setFakePixelRatio(ratio) {
    this.pixelRatio = this.stage.pixelRatio = ratio;
    $(window).resize();
  }

  /**
   * Gets the natural scale factor that can be used to
   * make elements look the same size regardless of the
   * canvas scale factor.
   */
  get naturalScaleFactor() {
    return {
      x: Math.max(1, this.pixelRatio / this.stage.scaleX),
      y: Math.max(1, this.pixelRatio / this.stage.scaleY)
    }
  }

  /**
   * Gets the font size of the underlying HTML canvas.
   */
  get fontSize() {
    return $(this.stage.canvas).css('font-size');
  }

  /**
   * Gets the width of the canvas.
   */
  get width() {
    return this.stage.canvas.width / this.stage.scaleX;
  }

  /**
   * Gets the height of the canvas.
   */
  get height() {
    return this.stage.canvas.height / this.stage.scaleY;
  }

  get expander() {
    return this._expander;
  }

  get deleter() {
    return this._deleter;
  }

  get rotator() {
    return this._rotator;
  }

  get pinner() {
    return this._pinner;
  }

  get mirror() {
    return this.mirrorIcon;
  }

  get settings() {
    return this._settingsIcon;
  }

  get activeContainer() {
    return this._activeContainer;
  }

  get activeObject() {
    return this._activeObject;
  }

  /**
   * Whether we're running on an Android browser.
   */
  get isAndroid() {
    return isAndroid;
  }

  /**
   * Whether we're running on Firefox.
   */
  get isFirefox() {
    return isFirefox;
  }

  /**
   * Gets an unique identifier.
   *
   * @returns {number}
   */
  getUID() {
    return this.uid++;
  }

  /**
   * Sets the UID. For persistence.
   * @param {number} id: the ID to set. Must be > 0.
   * @private
   */
  setUID(id = 0) {
    if (id > 0)
      this.uid = id;
  }

  /**
   * Announces that a shape it going to be created.
   *
   * @param {*} shape
   * @returns {Promise}
   */
  announceShape(shape) {
    // manage the ID map
    this.shapeById.set(shape.id, shape);
    shape.on("deleted", () => this.shapeById.delete(shape.id));

    // Store a Promise which resolves when the shape is raising the "created" event.
    // The promises are checked by the done() method.
    let p = new Promise((resolve) => shape.on("created", () => resolve(shape)));
    this.promises.push(p);
    return p;
  }

  /**
   * Adds a shape to the desktop.
   *
   * @param {*} shape
   */
  addShape(shape) {
    // store the Shape object in the container so we can find the Shape
    // object by iterating the stage.children collection. See getShapes().
    shape.container._shape = shape;

    // chose the layer to store the shape into
    switch (shape.layer) {
      case Shape.BackgroundLayer:
        this.backgroundLayer.addChild(shape.container);
        break;
      case Shape.ImageLayer:
        this.imageLayer.addChild(shape.container);
        break;
      case Shape.ToolLayer:
        this.toolLayer.addChild(shape.container);
        break;
      default:
        throw Error("shape does not override the layer property.");
    }

    this.dispatchEvent({
      type: "desktop:shapeadded",
      shape: shape
    });
    this.dispatchEvent("desktop:shapeschanged");
}

  /**
   * Returns the Shapes that were added to the stage.
   */
  getShapes() {
    // return the shapes contained in the specified layer
    let getLayerShapes = (layer) => {
      return layer.children
        .filter(x => x._shape && x._shape instanceof Shape)
        .map(x => x._shape);
    };

    return [].concat(
      getLayerShapes(this.backgroundLayer),
      getLayerShapes(this.imageLayer),
      getLayerShapes(this.toolLayer)
    );
  }

  /**
   * Gets the shape with the specified ID.
   *
   * @param {string} id
   */
  getShapeById(id) {
    return this.shapeById.get(id);
  }

  /**
   * Finds a shape by its tag.
   *
   * @param {string} tag
   */
  findShapeByTag(tag) {
    return this.getShapes().find((shape) => shape.tag === tag);
  }

  /**
   * See createjs.Stage.update().
   */
  update() {
    // use the animation machinery (see Desktop.tick())
    // for enabling the ticker during updates.
    this.tick((off) => {
      let handler = this.stage.on("drawend", () => {
        this.stage.off("drawend", handler);
        off();
      });
    });
  }

  /**
   * Enables the stage ticker temporarily.
   *
   * Why do we need this? An enabled stage ticker is consuming CPU
   * resources all the time even if we don't need it at all, because
   * our code does not depend on the ticker. We're calling stage.update()
   * manually.
   *
   * However, createjs.Tween/TweenJS (the animation module of createjs)
   * requires an active ticker. This method can be use to enable/disable
   * the stage ticker on demand, e.g. if we want to run animations.
   *
   * @see Desktop.animate().
   *
   * @example
   *
   * desktop.tick((off) => {
   *    do work ...
   *    off();
   * });
   *
   * or
   *
   * let off = desktop.tick();
   * do work ...
   * off();
   *
   * @param {function(any)=} callback.
   */
  tick(callback) {
    this.tickerDepth++;

    let off = () => {
      this.tickerDepth--;
      if (this.tickerDepth < 0) {
        this.tickerDepth = 0;
      }
    };

    if (callback) {
      callback(off);
    } else {
      return off;
    }
  }

  /**
   * Plays a TweenJS animation and returns a promise
   * which resolves when the animation has finished.
   *
   * @param {createjs.Tween} tween: the tween object to animate.
   *  The tween should be paused (setPaused(true)), though I don't
   *  know if this is really needed.
   * @returns {Promise}
   * @example see Shape.moveAnimated().
   */
  animate(tween) {
    return new Promise((resolve) => {
      this.tick((off) => { // start ticker
        tween
          .setPaused(false) // start any queued animations
          .call(resolve) // resolve the promise
          .call(off); // stop/remove ticker
      });
    });
  }

  /**
   * Installs a tick handler, which gets called synchronized
   * with "requestanimationframe".
   *
   * The callback is invoked with an "off" function as an argument.
   * The "off" function is used to uninstall the handler:
   *
   * this.desktop.setTicker((off) => {
   *   if (someCondition) {
   *     off();
   *   }
   * });
   *
   * @param {function} callback
   */
  setTicker(callback) {
    let getOffFunction = (handler) => {
      return () => this.off("desktoptick", handler);
    };

    let handler = this.on("desktoptick", (e) => {
      callback(getOffFunction(handler), e.tickerArgs);
    });

    return getOffFunction(handler);
  }

  /**
   * Blurs the active shape.
   */
  blur() {
    this.hideAdorners();
    if (this.activeObject) {
      this.activeObject.onBlur();

    }
  }

  /**
   * Focuses the specified shape.
   *
   * @param {*} shapeObject
   */
  focus(shapeObject) {
    let container = shapeObject.container;

    // don't blur when we're focusing twice
    if (this.activeObject != shapeObject) {
      this.blur();
    }

    this._activeContainer = shapeObject.container;
    this._activeObject = shapeObject;
    container.moveToTop();
    this.moveAdorners(shapeObject);
    shapeObject.onFocus();
    this.update();
  }

  hideAdorners() {
    this.expander.visible = false;
    this.rotator.visible = false;
    this.deleter.visible = false;
    this.pinner.visible = false;
    this.mirrorIcon.visible = false;
    this.settings.visible = false;
    this.contextMenu.container.visible = false;
    this.arrowContextMenu.container.visible = false;
    this.textContextMenu.container.visible = false;

    this.update();
  }

  moveContainer(shapeObject, offsetX, offsetY) {
    shapeObject.container.x += offsetX;
    shapeObject.container.y += offsetY;
    this.moveAdorners(shapeObject);
    this.update();
  }

  moveContainerTo(shapeObject, x, y) {
    shapeObject.container.x = x;
    shapeObject.container.y = y;
    this.moveAdorners(shapeObject);
    this.update();
  }

  moveAdorners(shapeObject) {
    if (!shapeObject.container.visible) {
      this.hideAdorners();
      return;
    }
    this.moveExpander(shapeObject);
    this.moveDeleter(shapeObject);
    this.moveRotator(shapeObject);
    this.movePinner(shapeObject);
    this.moveMirror(shapeObject);
    this.moveSettings(shapeObject);
    shapeObject.moved();
    shapeObject.dispatchEvent("moved");
  }

  moveExpander(shapeObject) {
    let pos = shapeObject.expanderPos;
    this.expander.x = pos.x;
    this.expander.y = pos.y;
    this.expander.rotation = 0;
    this.setRotation(this.expander, shapeObject.hasExpander, shapeObject.container);
  }

  moveDeleter(shapeObject) {
    let pos = shapeObject.deleterPos;
    this.deleter.x = pos.x;
    this.deleter.y = pos.y;
    this.deleter.rotation = 0;
    this.setRotation(this.deleter, shapeObject.hasDeleter, shapeObject.container);
  }

  moveRotator(shapeObject) {
    let pos = shapeObject.rotatorPos;
    this.rotator.x = pos.x;
    this.rotator.y = pos.y
    this.rotator.rotation = 0;
    this.setRotation(this.rotator, shapeObject.hasRotator, shapeObject.container);
  }

  movePinner(shapeObject) {
    let pos = shapeObject.pinnerPos;
    this.pinner.x = pos.x;
    this.pinner.y = pos.y
    this.pinner.rotation = 0;
    this.setPinnerState(shapeObject.movable);
    this.setRotation(this.pinner, shapeObject.hasPinner, shapeObject.container);
  }

  moveSettings(shapeObject) {
    let pos = shapeObject.settingsPos;
    this.settings.x = pos.x;
    this.settings.y = pos.y;
    this.settings.rotation = 0;
    this.setRotation(this.settings, shapeObject.hasSettings, shapeObject.container);
  }

  moveMirror(shapeObject) {
    let pos = shapeObject.mirrorPos;
    this.mirrorIcon.x = pos.x;
    this.mirrorIcon.y = pos.y
    this.mirrorIcon.rotation = 0;
    this.setRotation(this.mirrorIcon, shapeObject.hasMirror, shapeObject.container);
  }

  setRotation(object, action, activeCon) {
    if (action) {
      object.visible = true;
      this.rotateAdorners(activeCon, activeCon.rotation, object, object.x, object.y);
      this.stage.addChild(object);
    } else {
      object.visible = false;
    }
  }

  rotateAdorners(activeCon, angle, obj, x, y) {
    let myangle = angle * Math.PI / 180;

    let newpointX = Math.cos(myangle) * (x - activeCon.x) - Math.sin(myangle) * (y - activeCon.y) + activeCon.x;
    let newpointY = Math.sin(myangle) * (x - activeCon.x) + Math.cos(myangle) * (y - activeCon.y) + activeCon.y;

    obj.x = newpointX;
    obj.y = newpointY;

    obj.rotation = angle;
  }


  drawDeleter() {
    const deleter = this._deleter = new createjs.Container();

    let deleteshape = new createjs.Shape();
    let deletesymbol = new createjs.Shape();

    this.setAdornerStyle(deleter, deleteshape, deletesymbol);
    deletesymbol.graphics
      .moveTo(-7, -7)
      .lineTo(7, 7)
      .moveTo(7, -7)
      .lineTo(-7, 7)
      .endStroke();

    deleter.on("mousedown", (e) => {
      // kill native event
      e.nativeEvent.preventDefault();
      this.deleter.moveToTop();
      this.deleter.visible = false;
      this.expander.visible = false;
      this.rotator.visible = false;
      this.pinner.visible = false;
      this.mirrorIcon.visible = false;
      this.settings.visible = false;
      this.activeObject.remove();
      this._activeObject = null;
      this._activeContainer = null;
      this.update();
    });
  }

  drawRotator() {
    const rotator = this._rotator = new createjs.Container();

    let rotateshape = new createjs.Shape();
    let rotatesymbol = new createjs.Shape();

    this.setAdornerStyle(rotator, rotateshape, rotatesymbol);
    rotatesymbol.graphics
      .arc(0, 0, 6, 46, 0)
      .setStrokeStyle(2.5)
      .beginFill('#ffffff')
      .moveTo(10, 0)
      .lineTo(2, 0)
      .lineTo(6, 5)
      .lineTo(10, 0)
      .lineTo(2, 0)
      .endStroke();
    rotator.addChild(rotatesymbol);

    let mid;

    MovableMixin.attach(rotator);
    rotator.on("beginmove", () => {
      const container = this.activeContainer;
      rotator.moveToTop();
      mid = Math.atan2((container.cheight / 2), (container.cwidth / 2)) * 180 / Math.PI;
      this.update();
    });

    rotator.on("moving", (e) => {
      const container = this.activeContainer;
      const shapeObject = this.activeObject;
      let rotationValue;

      rotator.x += e.x;
      rotator.y += e.y;

      if (shapeObject.regPoint == 0) {
        rotationValue = Math.atan2((rotator.y - container.y), (rotator.x - container.x)) * 180 / Math.PI;
      } else {
        rotationValue = Math.atan2((rotator.y - container.y), (rotator.x - container.x)) * 180 / Math.PI + mid;
      }

      container.rotation = rotationValue;

      this.moveAdorners(this.activeObject);
      this.update();
    });
  }

  drawExpander() {
    const expander = this._expander = new createjs.Container();

    let expand_shape = new createjs.Shape();
    let expand_symbol = new createjs.Shape();

    this.setAdornerStyle(expander, expand_shape, expand_symbol);
    expand_symbol.graphics
      .moveTo(-7, 3)
      .lineTo(3, 3)
      .lineTo(3, -7)
      .endStroke();

    MovableMixin.attach(expander);
    expander.on("beginmove", (e) => {
      expander.moveToTop();
      this.activeObject.beforeResize(e);
      this.update();
    });

    expander.on("moving", (e) => {
      expander.x += e.x;
      expander.y += e.y;
      this.activeObject.resizeBy(e);
      this.moveAdorners(this.activeObject);
      this.update();
    });
  }

  drawSettings() {
    const settingsIcon = this._settingsIcon = new createjs.Container();

    let settings_shape = new createjs.Shape();
    let settings_symbol = new createjs.Shape();

    this.setAdornerStyle(settingsIcon, settings_shape, settings_symbol);


    settings_symbol.graphics
      .setStrokeStyle(0)
      .beginStroke("#ffffff")
      .beginFill("#fff");

    settings_symbol.graphics
      .moveTo(22.063, 14.11)
      .bezierCurveTo(22.112, 13.708, 22.142999999999997, 13.291, 22.142999999999997, 12.857999999999999)
      .bezierCurveTo(22.142999999999997, 12.424, 22.112, 12.005999999999998, 22.044999999999998, 11.604999999999999)
      .lineTo(24.761999999999997, 9.482999999999999)
      .bezierCurveTo(25.001999999999995, 9.29, 25.068999999999996, 8.935999999999998, 24.923999999999996, 8.662999999999998)
      .lineTo(22.351999999999997, 4.2109999999999985)
      .bezierCurveTo(22.189999999999998, 3.9209999999999985, 21.853999999999996, 3.8249999999999984, 21.564999999999998, 3.9209999999999985)
      .lineTo(18.366, 5.205999999999999)
      .bezierCurveTo(17.691, 4.691999999999998, 16.983, 4.274999999999999, 16.195999999999998, 3.9529999999999985)
      .lineTo(15.713999999999999, 0.5449999999999986)
      .bezierCurveTo(15.667, 0.226, 15.392, 0, 15.07, 0)
      .lineTo(9.928, 0)
      .bezierCurveTo(9.606, 0, 9.349, 0.226, 9.3, 0.546)
      .lineTo(8.819, 3.954)
      .bezierCurveTo(8.032, 4.276, 7.308, 4.71, 6.649, 5.207)
      .lineTo(3.451, 3.922)
      .bezierCurveTo(3.161, 3.81, 2.824, 3.922, 2.6630000000000003, 4.212)
      .lineTo(0.091, 8.663)
      .bezierCurveTo(-0.069, 8.952, -0.0040000000000000036, 9.289, 0.252, 9.483)
      .lineTo(2.968, 11.605)
      .bezierCurveTo(2.904, 12.007, 2.856, 12.440000000000001, 2.856, 12.858)
      .bezierCurveTo(2.856, 13.275, 2.888, 13.709, 2.953, 14.110000000000001)
      .lineTo(0.23699999999999966, 16.232)
      .bezierCurveTo(-0.004000000000000337, 16.427, -0.06800000000000034, 16.779, 0.07599999999999965, 17.052)
      .lineTo(2.6479999999999997, 21.503)
      .bezierCurveTo(2.8089999999999997, 21.794, 3.146, 21.89, 3.4349999999999996, 21.794)
      .lineTo(6.6339999999999995, 20.507)
      .bezierCurveTo(7.308999999999999, 21.023000000000003, 8.016, 21.439, 8.803999999999998, 21.761000000000003)
      .lineTo(9.284999999999998, 25.169000000000004)
      .bezierCurveTo(9.348999999999998, 25.487000000000005, 9.606999999999998, 25.714000000000006, 9.927999999999999, 25.714000000000006)
      .lineTo(15.070999999999998, 25.714000000000006)
      .bezierCurveTo(15.392999999999997, 25.714000000000006, 15.666999999999998, 25.487000000000005, 15.697999999999999, 25.169000000000004)
      .lineTo(16.18, 21.761000000000003)
      .bezierCurveTo(16.966, 21.439000000000004, 17.691, 21.007, 18.35, 20.507)
      .lineTo(21.548000000000002, 21.794)
      .bezierCurveTo(21.838, 21.905, 22.174000000000003, 21.794, 22.336000000000002, 21.503)
      .lineTo(24.908, 17.052)
      .bezierCurveTo(25.068, 16.762999999999998, 25.002000000000002, 16.427, 24.746000000000002, 16.232)
      .lineTo(22.063, 14.11)
      .closePath()
      .moveTo(12.5, 17.68)
      .bezierCurveTo(9.847999999999999, 17.68, 7.678, 15.511, 7.678, 12.858)
      .bezierCurveTo(7.678, 10.206, 9.847999999999999, 8.036000000000001, 12.5, 8.036000000000001)
      .bezierCurveTo(15.152000000000001, 8.036000000000001, 17.320999999999998, 10.206000000000001, 17.320999999999998, 12.858)
      .bezierCurveTo(17.321, 15.51, 15.152, 17.68, 12.5, 17.68)
      .endStroke();

    settings_symbol.x = -10;
    settings_symbol.y = -10;
    settings_symbol.scaleX = 0.8;
    settings_symbol.scaleY = 0.8;

    settingsIcon.on("mousedown", (e) => {
      // kill native event
      e.nativeEvent.preventDefault();
      this.activeObject.showSettings();
    });

  }

  drawPinner() {
    const pinner = this._pinner = new createjs.Container();

    let pin_shape = new createjs.Shape();
    let pin_symbol = new createjs.Shape();

    this.setAdornerStyle(pinner, pin_shape, pin_symbol);

    pin_symbol.graphics
      .setStrokeStyle(0)
      .beginStroke("#ffffff")
      .beginFill("#fff");

    this.makePin(pin_symbol);

    pinner.on("mousedown", (e) => {
      // kill native event
      e.nativeEvent.preventDefault();
      this.activeObject.movable = !this.activeObject.movable;
      this.setPinnerState(this.activeObject.movable);
    });
  }

  setPinnerState(state) {
    let shape = this.pinner.children[1];
    shape.graphics.clear();
    if (state) {
      shape.graphics
        .setStrokeStyle(0)
        .beginStroke("#ffffff")
        .beginFill("#fff");
      this.makePin(shape);
    } else {
      shape.graphics
        .setStrokeStyle(0)
        .beginStroke("#cc3333")
        .beginFill("#cc3333");
      this.makePin(shape);
    }
  }

  makePin(pin_symbol) {
    pin_symbol.graphics
      .moveTo(14.886, 4.335)
      .lineTo(10.665, 0.11399999999999988)
      .bezierCurveTo(10.513, -0.03800000000000012, 10.265999999999998, -0.03800000000000012, 10.113, 0.11399999999999988)
      .lineTo(10.094999999999999, 0.13199999999999987)
      .bezierCurveTo(9.837, 0.391, 9.694, 0.736, 9.694, 1.101)
      .bezierCurveTo(9.694, 1.337, 9.754000000000001, 1.563, 9.865, 1.764)
      .lineTo(5.449, 5.554)
      .bezierCurveTo(5.111, 5.252, 4.68, 5.086, 4.223, 5.086)
      .bezierCurveTo(3.731, 5.086, 3.268, 5.2780000000000005, 2.92, 5.626)
      .lineTo(2.894, 5.653)
      .bezierCurveTo(2.742, 5.805, 2.742, 6.053, 2.894, 6.205)
      .lineTo(5.422000000000001, 8.733)
      .lineTo(2.9600000000000004, 11.196000000000002)
      .bezierCurveTo(2.9110000000000005, 11.247000000000002, 1.7450000000000003, 12.447000000000001, 0.9790000000000003, 13.403000000000002)
      .bezierCurveTo(0.24900000000000033, 14.313000000000002, 0.10500000000000032, 14.480000000000002, 0.09700000000000031, 14.489000000000003)
      .bezierCurveTo(-0.0379999999999997, 14.643000000000002, -0.030999999999999694, 14.876000000000003, 0.11400000000000031, 15.021000000000003)
      .bezierCurveTo(0.1900000000000003, 15.097000000000003, 0.2900000000000003, 15.136000000000003, 0.39100000000000035, 15.136000000000003)
      .bezierCurveTo(0.4830000000000003, 15.136000000000003, 0.5750000000000004, 15.104000000000003, 0.6480000000000004, 15.039000000000003)
      .bezierCurveTo(0.6540000000000004, 15.033000000000003, 0.8170000000000004, 14.892000000000003, 1.7330000000000003, 14.157000000000004)
      .bezierCurveTo(2.689, 13.390000000000004, 3.8900000000000006, 12.225000000000003, 3.944, 12.172000000000004)
      .lineTo(6.402, 9.714000000000004)
      .lineTo(8.795, 12.107000000000003)
      .bezierCurveTo(8.871, 12.183000000000003, 8.971, 12.221000000000004, 9.07, 12.221000000000004)
      .bezierCurveTo(9.171000000000001, 12.221000000000004, 9.27, 12.183000000000003, 9.346, 12.107000000000003)
      .lineTo(9.372, 12.081000000000003)
      .bezierCurveTo(9.721, 11.733000000000002, 9.911999999999999, 11.270000000000003, 9.911999999999999, 10.778000000000002)
      .bezierCurveTo(9.911999999999999, 10.321000000000002, 9.747, 9.889000000000003, 9.443999999999999, 9.551000000000002)
      .lineTo(13.233999999999998, 5.135000000000002)
      .bezierCurveTo(13.434999999999999, 5.246000000000001, 13.660999999999998, 5.306000000000002, 13.896999999999998, 5.306000000000002)
      .bezierCurveTo(14.261999999999999, 5.306000000000002, 14.607, 5.163000000000002, 14.865999999999998, 4.905000000000002)
      .lineTo(14.883999999999999, 4.887000000000002)
      .bezierCurveTo(15.038, 4.735, 15.038, 4.488, 14.886, 4.335)
      .endStroke();

    pin_symbol.x = -7;
    pin_symbol.y = -8;
  }


  drawMirrorIcon() {
    const mirrorIcon = this.mirrorIcon = new createjs.Container();

    let mirrorshape = new createjs.Shape();
    let mirrorsymbol = new createjs.Shape();

    this.setAdornerStyle(mirrorIcon, mirrorshape, mirrorsymbol);

    mirrorsymbol.graphics
      .arc(0, 0, 8, Math.PI, 0)

      .beginFill('#ffffff')
      .setStrokeStyle(1)
      .moveTo(12, 0)
      .lineTo(4, 0)
      .lineTo(8, 5)
      .lineTo(12, 0)
      .lineTo(4, 0)

      .moveTo(-12, 0)
      .lineTo(-4, 0)
      .lineTo(-8, 5)
      .lineTo(-12, 0)
      .lineTo(-4, 0)
      .setStrokeStyle(1.5)
      .moveTo(0, -12)
      .lineTo(0, 12)

      .endStroke();

    mirrorIcon.on("mousedown", (e) => {
      // kill native event
      e.nativeEvent.preventDefault();
      this.activeObject.mirrorObject(e);
      this.moveAdorners(this.activeObject);
      this.update();
    });

  }

  setAdornerStyle(obj, shape, symbol) {
    obj.addChild(shape);
    obj.addChild(symbol);
    this.stage.addChild(obj);

    shape.graphics
      .beginStroke("#ffffff")
      .setStrokeStyle(2)
      .beginFill("#888888")
      .drawCircle(0, 0, 15)
      .endFill();
    shape.alpha = 0.6;

    symbol.graphics
      .setStrokeStyle(5)
      .beginStroke("#ffffff");

    obj.visible = false;
    this.update();
  }

  /**
   * Whether the current container and/or its decoration were hit
   * by the mouse pointer.
   */
  decorationHitTest() {
    const container = this.activeContainer;
    if (!container) return false;

    const stage = this.stage;
    const decorationElements = [
      container, // treat current container as decoration, too
      this.rotator,
      this.expander,
      this.pinner,
      this.mirrorIcon,
      this.settings,
      // context menus are decoration, too.
      this.contextMenu.container,
      this.arrowContextMenu.container,
      this.textContextMenu.container
    ];

    for (let elem of decorationElements) {
      if (elem.visible) {
        let point = elem.globalToLocal(stage.mouseX, stage.mouseY);
        if (elem.hitTest(point.x, point.y)) {
          return true;
        }
      }
    }

    return false;
  }

  stageMousedown(event) {
    const stage = this.stage;

    if (stage.mouseInBounds && this.decorationHitTest()) {
      // kill native event to prevent scrolling on touch devices
      event.nativeEvent.preventDefault();
    } else {
      // blur current object
      this.blur();
    }

    this.update();
  }

  /**
   * Persists a shape property with the name @name so it can be restored
   * from local storage. Fluent.
   *
   * @param {Shape|Desktop} shape
   * @param {string} name
   * @param {*} value
   */
  store(shape, name, value) {
    this.storage.store(shape.id + '.' + name, value);
    return this;
  }

  /**
   * Persists a shape object property with the name @name.
   * Only shape objects are supported.
   *
   * @param {Shape} shape
   * @param {string} name
   * @param {Shape} shapeObj
   */
  storeObject(shape, name, shapeObj) {
    this.storage.store(shape.id + '.' + name, shapeObj.id);
    return this;
  }

  /**
   * Loads a shape property with the name @name from local storage.
   *
   * @param {Shape|Desktop} shape
   * @param {string} name
   * @param {*} defaultValue
   */
  load(shape, name, defaultValue) {
    return this.storage.load(shape.id + '.' + name, defaultValue);
  }

  /**
   * Loads a shape property of the type @type with the name @name
   * from local storage.
   *
   * @param {Shape} shape
   * @param {string} name
   * @param {*} type
   * @param {Shape} defaultValue
   * @returns {Shape}
   */
  loadObject(shape, name, type, defaultValue) {
    // get id
    let id = this.storage.load(shape.id + '.' + name);
    if (!id) return defaultValue;

    // get shape from id
    let ref = this.getShapeById(id);
    if (!ref) return defaultValue;

    // check shape's type
    return ref instanceof type ? ref : defaultValue;
  }

  /**
   * clears all shape keys from the local storage.
   */
  clearStorage() {
    this.storage.clear();
  }

  /**
   * Clears the storage of the specified shape.
   *
   * @param {Shape} shape
   */
  clearShapeStorage(shape) {
    this.storage.clear(shape.id + '.');
  }

  /**
   * Gets all key/value pairs stored for the given @shape.
   * The keys are shape keys as returned by Shape.shapeToStorageMap.
   *
   * @param {Shape} shape
   * @returns {Object}
   */
  getStorageMap(shape) {
    const storageMap = this.storage.getMap(shape.id + '.');
    const shapeToStorageMap = shape.shapeToStorageMap;
    const res = {};
    forOwn(shapeToStorageMap, (mapKey, shapeKey) => {
      let value = storageMap[mapKey];
      if (value != undefined)
        res[shapeKey] = value;
    });
    return res;
  }

  /**
   * Persists all shapes.
   *
   * Also stores the indexes (see EaselJS get/setChildIndex) so we can restore
   * the z-index of the shapes on reload.
   */
  persist() {
    let indexes = this.getShapes()
      // we persist only shapes with a parent
      .filter(shape => shape.container.parent)
      // persist and return the id
      .map(shape => {
        shape.persist();
        return shape.id;
      });
    // store the IDs of the shapes
    this.store(this, "I", indexes);
    this.dispatchEvent("persisted");
  }

  /**
   * Restores the z-order of the shapes.
   */
  restoreZOrder() {
    let list = [];

    for (let child of this.getShapes()) {
      let order = this.indexes.findIndex(x => x === child.id);
      if (order >= 0) list[order] = child;
    }

    // focus shapes in their stored order, i.e. restore their z-order.
    for (let child of list) {
      if (child) child.focus();
    }
  }

  /**
   * Waits asynchronously for all shapes to be created and restores
   * their z-order. Returns a promise which will be resolved after
   * the z-order has been restored.
   */
  done() {
    return Promise.all(this.promises).then(() => this.restoreZOrder());
  }

  /**
   * Returns the URL of the screenshot of the underlying canvas.
   *
   * @param {Number} scaleFactor: the scale factor of the screenshot.
   * @param {String} backgroundColor: the background color of the
   * screenshot.
   * @returns {String}: the DATA URL of the the screenshot's image.
   */
  getScreenshot(scaleFactor = 2, backgroundColor = 'white') {
    const stage = this.stage;
    this.blur();

    // when pixel ratio > 1, scale down to prevent taking HUGE
    // screenshots in 4K format :)
    scaleFactor = Math.max(1, scaleFactor / this.pixelRatio);

    // save
    let width = stage.canvas.width;
    let height = stage.canvas.height;
    let sx = stage.scaleX;
    let sy = stage.scaleY;

    try {
      // scale
      stage.canvas.height = height * scaleFactor;
      stage.canvas.width = width * scaleFactor;
      stage.scaleX = sx * scaleFactor;
      stage.scaleY = sy * scaleFactor;
      stage.update();
      return stage.toDataURL(backgroundColor);
    } finally {
      // restore
      stage.canvas.height = height;
      stage.canvas.width = width;
      stage.scaleX = sx;
      stage.scaleY = sy;
      stage.update();
    }
  }

  /**
   * Returns the BLOB URL of the screenshot of the underlying canvas.
   *
   * @param {Number} scaleFactor: the scale factor of the screenshot.
   * @param {String} backgroundColor: the background color of the
   * screenshot.
   * @returns {Promise}: returns the URL via resolve() argument.
   */
  getScreenshotBlob(scaleFactor = 2, backgroundColor = 'white') {
    const stage = this.stage;

    // check whether toBlob() is supported
    if (!stage.canvas.toBlob) {
      return Promise.resolve(this.getScreenshot(scaleFactor, backgroundColor));
    }

    this.blur();

    // when pixel ratio > 1, scale down to prevent taking HUGE
    // screenshots in 4K format :)
    scaleFactor = Math.max(1, scaleFactor / this.pixelRatio);

    // save
    let width = stage.canvas.width;
    let height = stage.canvas.height;
    let sx = stage.scaleX;
    let sy = stage.scaleY;

    // scale
    stage.canvas.height = height * scaleFactor;
    stage.canvas.width = width * scaleFactor;
    stage.scaleX = sx * scaleFactor;
    stage.scaleY = sy * scaleFactor;
    stage.update();

    return new Promise((resolve) => {
      // set background color
      let ctx = stage.canvas.getContext('2d');
      let w = stage.canvas.width;
      let h = stage.canvas.height;
      let data = ctx.getImageData(0, 0, w, h);
      let compositeOperation = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      stage.canvas.toBlob((blob) => {
        // get blob URL
        let url = URL.createObjectURL(blob);

        // restore background color
        ctx.putImageData(data, 0, 0);
        ctx.globalCompositeOperation = compositeOperation;

        // restore scale factor
        stage.canvas.height = height;
        stage.canvas.width = width;
        stage.scaleX = sx;
        stage.scaleY = sy;
        stage.update();

        // publish blob url
        resolve(url);
      });
    });
  }

  /**
   * Gets a random point inside the desktop
   * @returns {createjs.Point}
   */
  get randomPoint() {
    return new createjs.Point(
      Math.random() * this.width,
      Math.random() * this.height
    );
  }

  /**
   * Installs an upload handler and upload view inside the element
   * specified by the id parameter. The element must include
   * the CSS class "dropzone".
   *
   * @param {string} id
   * @param {Object} dropzoneOptions
   * @param {function} handler
   *
   * @returns {Dropzone}
   */
  installUploadHandler(id, dropzoneOptions, handler) {
    dropzoneOptions = Object.assign({}, {
      url: this.factory.sessionServer.baseUri + '/upload',
      paramName: 'file',
      // FIXME: Safari/Mac needs extensions (.mp4 etc.). Maybe a bug in Dropzone...
      acceptedFiles: 'image/*,video/*,audio/*,.mp4,.m4v,.m4a'
    }, dropzoneOptions);

    let dropzone = new Dropzone('#' + id, dropzoneOptions);
    dropzone.on('success', (file, response) => {
      if (response && response.success && handler) {
        let uri = this.factory.sessionServer.blobGetUri(response.id);
        handler(dropzone, file, uri);
      }
    });

    //
    // implement Ctrl-V uploads
    //

    if (dropzoneOptions.disableCtrlV)
      return;

    // window.paste event handler
    const pasteHandler = (event) => {
      event.preventDefault();
      // delegate to Dropzone's paste() function
      dropzone['paste'](event);
    };

    window.addEventListener('paste', pasteHandler);

    // override Dropzone's destroy() method
    const originalDestroy = dropzone.destroy;
    dropzone.destroy = () => {
      // remove paste handler
      window.removeEventListener('paste', pasteHandler);

      // delegate to Dropzone.destroy()
      return originalDestroy.call(dropzone);
    };

    return dropzone;
  }

  /**
   * Clears the desktop by removing all shapes.
   */
  clear() {
    this.getShapes().forEach(shape => {
      shape.remove();
    })
    this.clearStorage();
  }
}

// add EventDispatcher capabilities
createjs.EventDispatcher.initialize(Desktop.prototype);
