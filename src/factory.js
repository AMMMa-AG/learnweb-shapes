/*
 * $Id: factory.js 47571 2019-03-22 18:58:56Z robertj $
 */

import { createjs } from 'EaselJS';

import Utils from './utils';
import Shape from './shape';
import Desktop from './desktop';
import Circle from './circle';
import SpeechBubble from './speechbubble';
import Rectangle from './rectangle';
import Triangle from './triangle';
import Numbering from './numbering';
import Draggable from './draggable';
import Player from './player';
import AudioPlayer from './audioplayer';
import Arrow from './arrow';
import Section from './section';
import Slider from './slider';
import RadarChart from './radarchart';
import RadarGraph from './radargraph';
import Timeline from './timeline';
import LineChart from './linechart';
import Pie from './pie';
import Crescendo from './crescendo';
import Counter from './counter';
import Textfield from './textfield';
import DraggableText from './draggabletext';
import ArrowConnection from './arrowconnection';
import PieConnection from './pieconnection';
import BackgroundImage from './backgroundimage';
import BackgroundContainer from './backgroundcontainer';
import ColorPicker from './colorpicker';
import Crop from './crop';
import Freehand from './freehand';
import Bar from './bar';
import Storage from './storage';
import SessionServerClient from './sessionserverclient';
import DragDropExercise from './exercises/dragdrop';
import DragDropModel from './exercises/dragdropmodel';
import ComplexDragDropExecise from './exercises/complexdragdropexercise';
import Layouts from './layouts/index';
import FullScreenView from './fullscreenview';
import BlobStorageHolder from './blobstorageholder';
import EditBox from './editbox';

import defaultTo from 'lodash/defaultTo';
import flatten from 'lodash/flatten';

/*
 * Static globals
 */
const SerializationProtocolVersion = 5;
const Options = {
  designWidth: 0,
  debug: !!process.env.DEBUG,
  build: process.env.DEBUG ? "debug" : "release",
  // this is ammma.net's default SessionServer's URI:
  sessionServerUrl: "/sessionserver",
  storagePrefix: "",
  storeDataUrls: true
};
const Factories = [];
const ExportedClasses = {
  createjs,
  DragDropModel,
  Layouts,
  Storage,
  SessionServerClient,
  FullScreenView,
  Utils
};

export default class Factory {
  constructor(canvas, fitParent = false, designWidth = 0, version = SerializationProtocolVersion) {
    let stage = new createjs.Stage(canvas);
    let width = designWidth || Options.designWidth;
    this.desktop = new Desktop(this, stage, fitParent, width, version, Options.storagePrefix);

    this.defaultSimpleShapeOptions = {
      width: 100,
      x: 100,
      y: 100,
      color: "red",
      backgroundColor: "white",
      backgroundAlpha: 0,
      strokeWidth: 1,
      deletable: true,
      resizable: true,
      proportional: true,
      rotatable: true,
      pinable: true,
      adjustable: false,
      regPoint: 1
    };

    this.calls = [];
    this.staticCalls = [];

    Factories.push(this);
  }

  /**
   * Sets the global configuration options.
   *
   * @param {Object} options (see the static Options constant above).
   */
  static configure(options) {
    return Object.assign(Options, options);
  }

  /**
   * Gets the global configuration options
   */
  static get options() {
    // return a copy of Options
    return Object.assign({}, Options);
  }

  /**
   * Gets the underlying canvas object.
   */
  get canvas() {
    return this.desktop.stage.canvas;
  }

  /**
   * Gets the Session Server of this factory.
   */
  get sessionServer() {
    if (!this._sessionServer)
      this._sessionServer = new SessionServerClient(Options.sessionServerUrl);
    return this._sessionServer;
  }

  /**
   * Creates a configured Session Server.
   * This method is static and does not require a Factory instance.
   */
  static createSessionServer() {
    return new SessionServerClient(Options.sessionServerUrl);
  }

  /**
   * Retuns an object that contains additional classes to be
   * exported by the factory.
   *
   * @example
   *
   * var instance = shapes.Factory.Classes.Foobar();
   */
  static get Classes() {
    return ExportedClasses;
  }

  /**
   * Returns all created factories on the page so far.
   *
   * @returns {Factory[]}
   */
  static get factories() {
    return Factories;
  }

  /**
   * Returns the factory of the specified HTML canvas.
   *
   * @param {HTMLCanvasElement} canvas
   */
  static findByCanvas(canvas) {
    return Factories.find((value) => value.canvas === canvas);
  }

  /**
   * Clears the local storage used by all shape factories
   * on the current page. Note that this method may clear
   * other (non-shape) local storage keys as well.
   *
   * @param {boolean} reload: whether to reload the page.
   */
  static clearStorage(reload = false) {
    Storage.clearAll();
    if (reload)
      window.location.reload();
  }

  /**
   * Refreshes all factories on the page.
   */
  static refresh() {
    // keep in sync with desktop's resize handler!
    $(window).triggerHandler('resize', 1);
  }

  /**
   * Tells the desktop that the script consuming the factory has created
   * all its "static" Shapes. This method must be called, or otherwise the
   * z-order of the shapes, persistence etc. won't be restored.
   *
   * @returns {Promise}
   */
  done() {
    return this.desktop.done().then(() => {
      // replay only once
      if (!this.callsReplayed) {
        this.callsReplayed = true;
        this.replayCalls();
        return this.desktop.done();
      }
    });
  }

  /*
   * Serialization
   */

  /**
   * Records a factory method call.
   *
   * @param {string} methodName: the method name
   * @param {any|any[]} args: method args
   * @param {*} obj: the shape object
   * @param {number} [index=-1]: the optional index where to set the call
   */
  recordCall(methodName, args, obj, index = -1) {
    // remember the factory method name that was used to create the shape
    obj.factoryMethodName = methodName;

    // support both
    //    recordCall("name", arg, obj)
    // and
    //    recordCall("name", [args], obj)
    args = Array.isArray(args) ? args : [args];

    if (args[0].persist) {
      // record dynamic method call

      const entry = {
        methodName,
        args,
        obj,
        id: obj.id // keep track of object's identity
      };

      if (index >= 0) {
        this.calls[index] = entry;
      } else {
        this.calls.push(entry);
      }

      // store
      this.storeCalls();

      // monitor shape's "deleted" event to remove the call
      if (obj.on) {
        obj.on("deleted", () => {
          this.calls = this.calls.filter((call) => call.obj != obj);
          this.storeCalls();
        });
      }

    } else {
      // monitor static calls in debug mode
      if (Options.debug) {
        this.staticCalls.push({
          methodName,
          args,
          obj
        });
      }
    }

    return obj;
  }

  /**
   * Records an empty call and returns its index.
   *
   * @returns {number}
   */
  recordEmptyCall() {
    this.recordCall("__empty__", { persist: true }, {});
    return this.calls.length - 1;
  }

  /**
   * Persists the calls.
   */
  storeCalls() {
    this.desktop.store(this.desktop, "_calls",
      this.calls.map((call) => {
        return {
          methodName: call.methodName,
          args: call.args,
          id: call.id
        }
      }));
  }

  /**
   * Replays factory method calls previously recorded by recordCall().
   */
  replayCalls() {
    let calls = this.desktop.load(this.desktop, "_calls", []);
    calls.forEach((call) => {
      try {
        if (process.env.DEBUG)
          console.log(this.canvas.id, call.methodName, ...call.args);
        // skip empty calls
        if (call.methodName != "__empty__") {
          // preset ID
          this.desktop.setUID(call.id);
          this[call.methodName](...call.args);
        }
      } catch (e) {
        if (process.env.DEBUG)
          console.log(e);
      }
    });
  }

  /**
   * Gets all static calls recorded so far as JavaScript code.
   */
  getStaticCode() {
    return this.staticCalls.map(call => {
      let args = call.args.map((arg, index) => {
        if (index == 0 && typeof(arg) === 'object') {
          arg = Object.assign({}, arg, this.desktop.getStorageMap(call.obj));
        }
        return JSON.stringify(arg, undefined, 2);
      }).join(",\n");
      return `f.${call.methodName}(${args});\n`;
    }).join("\n");
  }

  /**
   * Gets all dynamic calls recorded so far as JavaScript code.
   */
  getDynamicCode() {
    return this.calls.map(call => {
      let args = call.args.map((arg, index) => {
        if (index == 0 && typeof(arg) === 'object') {
          // get rid of "persist" w/out touching the original object
          arg = Object.assign({}, arg, this.desktop.getStorageMap(call.obj));
          delete(arg.persist);
        }
        return JSON.stringify(arg, undefined, 2);
      }).join(",\n");
      return `f.${call.methodName}(${args});\n`;
    }).join("\n");
  }

  /**
   * Gets all calls recorded so far as JavaScript code.
   */
  getCode() {
    return [{
          name: "Static calls",
          code: this.getStaticCode()
        },
        {
          name: "Dynamic calls",
          code: this.getDynamicCode()
        }
      ]
      .filter(item => item.code)
      .map(item => `//\n// ${item.name}\n//\n${item.code}`)
      .join("\n\n");
  }

  /*
   * Shape factory
   */

  checkPinable(options) {
    // FIXME
    // compatibility: if none of deletable, resizable, rotatable were
    // specified, assume that we also don't want pinable.
    if (!(options.deletable || options.resizable || options.rotatable))
      options.pinable = false;

    return options;
  }

  createCircle(options) {
    options = Object.assign({}, this.defaultSimpleShapeOptions, options);
    options = this.checkPinable(options);

    return this.recordCall("createCircle", options,
      new Circle(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.color,
        options.backgroundColor,
        options.backgroundAlpha,
        options.strokeWidth,
        options.deletable,
        options.resizable,
        options.proportional,
        options.rotatable,
        options.regPoint,
        options.pinable,
        options.adjustable
      ));
  }

  createRectangle(options) {
    options = Object.assign({}, this.defaultSimpleShapeOptions, options);
    options = this.checkPinable(options);

    return this.recordCall("createRectangle", options,
      new Rectangle(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.color,
        options.backgroundColor,
        options.backgroundAlpha,
        options.strokeWidth,
        options.deletable,
        options.resizable,
        options.proportional,
        options.rotatable,
        options.regPoint,
        options.pinable,
        options.adjustable
      ));
  }

  createTriangle(options) {
    options = Object.assign({}, this.defaultSimpleShapeOptions, options);
    options = this.checkPinable(options);

    return this.recordCall("createTriangle", options,
      new Triangle(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.color,
        options.backgroundColor,
        options.backgroundAlpha,
        options.strokeWidth,
        options.deletable,
        options.resizable,
        options.proportional,
        options.rotatable,
        options.regPoint,
        options.pinable,
        options.adjustable
      ));
  }

  createDraggable(options) {
    options = Object.assign({}, {
      width: 100,
      height: 0,
      x: 100,
      y: 100,
      labelText: '',
      labelColor: '#F9775C',
      deletable: true,
      resizable: true,
      rotatable: true,
      pinable: true,
      mirror: false,
      adjustable: false,
      regPoint: 1,
      layer: Shape.ImageLayer
    }, options);

    options = this.checkPinable(options);

    // dignostics
    if (options.persist && options.path && typeof options.path !== 'string') {
      // cannot persist draggables with no string URL
      delete(options.persist);
      // be extra pedantic here because the code will run on production
      if (console && console.warn)
        console.warn("createDraggable", options,
          "Objects cannot be persisted. Use real paths or data URLs instead!");
    }

    let obj = new Draggable(
      this.desktop,
      options.path,
      options.width,
      options.height,
      options.x,
      options.y,
      options.labelText,
      options.labelColor,
      options.deletable,
      options.resizable,
      options.rotatable,
      options.regPoint,
      options.layer,
      options.pinable,
      options.mirror,
      options.adjustable
    );

    // check if we want to persist a draggable from a data URL
    if (options.persist && options.path && typeof options.path === 'string') {
      if (Options.storeDataUrls && BlobStorageHolder.isDataUrl(options.path)) {
        const holder = new BlobStorageHolder(this.sessionServer, options.path);
        const index = this.recordEmptyCall();
        holder.getUrl().then(url => {
          // okay, we've got a server url. record the call with this new url.
          // insert the call at the original index.
          options.path = url;
          this.recordCall("createDraggable", options, obj, index);
        });

        // postpone call record
        return obj;
      }
    }

    return this.recordCall("createDraggable", options, obj);
  }

  createPlayer(options) {
    options = Object.assign({}, {
      width: 100,
      height: 0,
      x: 100,
      y: 100,
      labelText: '',
      labelColor: '#F9775C',
      deletable: true,
      resizable: true,
      rotatable: true,
      pinable: true,
      adjustable: false,
      regPoint: 0,
      layer: Shape.ToolLayer
    }, options);

    options = this.checkPinable(options);

    // dignostics
    if (options.persist && options.path && typeof options.path !== 'string') {
      // cannot persist draggables with no string URL
      delete(options.persist);
      // be extra pedantic here because the code will run on production
      if (console && console.warn)
        console.warn("createPlayer", options,
          "Objects cannot be persisted. Use real paths or data URLs instead!");
    }

    let obj = new Player(
      this.desktop,
      options.path,
      options.width,
      options.height,
      options.x,
      options.y,
      options.labelText,
      options.labelColor,
      options.deletable,
      options.resizable,
      options.rotatable,
      options.regPoint,
      options.layer,
      options.pinable,
      options.adjustable
    );
    return this.recordCall("createPlayer", options, obj);
  }


  createAudioPlayer(options) {
    options = Object.assign({}, {
      width: 100,
      height: 0,
      x: 100,
      y: 100,
      deletable: true,
      resizable: true,
      rotatable: true,
      pinable: true,
      regPoint: 0,
      adjustable: false,
      layer: Shape.ToolLayer
    }, options);
    options = this.checkPinable(options);

    let obj = new AudioPlayer(
      this.desktop,
      options.path,
      options.width,
      options.height,
      options.x,
      options.y,
      options.deletable,
      options.resizable,
      options.rotatable,
      options.regPoint,
      options.layer,
      options.pinable,
      options.adjustable
    );
    return this.recordCall("createAudioPlayer", options, obj);
  }

  createArrow(options) {
    options = Object.assign({}, {
      heads: 2,
      length: 100,
      arrowWidth: 25,
      x: 100,
      y: 100,
      color: "red",
      strokeWidth: 7,
      deletable: true,
      strokeStyle: 0,
      adjustable: false
    }, options);
    return this.recordCall("createArrow", options,
      new Arrow(
        this.desktop,
        options.heads,
        options.length,
        options.arrowWidth,
        options.x,
        options.y,
        options.color,
        options.strokeWidth,
        options.deletable,
        options.strokeStyle,
        options.adjustable
      ));
  }

  createBar(options) {
    options = Object.assign({}, {
      width: 80,
      height: 200,
      maxheight: 300,
      x: 100,
      y: 100,
      color: "#434343",
      alpha: 0.8,
    }, options);

    return this.recordCall("createBar", options,
      new Bar(
        this.desktop,
        options.width,
        options.height,
        options.maxheight,
        options.x,
        options.y,
        options.color,
        options.alpha
      ));
  }

  createRadarChart(options) {
    options = Object.assign({}, {
      width: 500,
      x: 100,
      y: 100,
      knotNumber: 5,
      lineColor: 7,
      backgroundColor: true,
      range: 5,
      labels: ["label1"]
    }, options);

    return this.recordCall("createRadarChart", options,
      new RadarChart(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.knotNumber,
        options.lineColor,
        options.backgroundColor,
        options.range,
        options.labels
      ));
  }

  createRadarGraph(options) {
    options = Object.assign({}, {
      chart: null,
      color: "green",
      value: 4
    }, options);

    if (options.persist) {
      delete(options.persist);
      if (process.env.DEBUG)
        console.warn("cannot persist Graph into call history because it depends on a Chart object");
    }

    return this.recordCall("createRadarGraph", options,
      new RadarGraph(
        this.desktop,
        options.chart,
        options.color,
        options.value
      ));
  }

  createDraggableText(options) {
    options = Object.assign({}, this.defaultSimpleShapeOptions, options);

    return this.recordCall("createDraggableText", options,
      new DraggableText(
        this.desktop,
        options.string,
        options.x,
        options.y,
        options.maxlength,
        options.textcolor,
        options.backgroundColor,
        options.backgroundAlpha,
        options.deletable,
        options.font
      ));
  }

  createSlider(options) {
    options = Object.assign({}, {
      width: 300,
      height: 50,
      x: 100,
      y: 100,
      maxlength: 50,
      backcolor: "grey",
      slidercolor: "green",
      linecolor: "black",
      label1: "links",
      label2: "rechts"
    }, options);

    return this.recordCall("createSlider", options,
      new Slider(
        this.desktop,
        options.width,
        options.height,
        options.x,
        options.y,
        options.backcolor,
        options.slidercolor,
        options.linecolor,
        options.label1,
        options.label2
      ));
  }

  createSection(options) {
    options = Object.assign({}, {
      length: 100,
      x: 100,
      y: 100,
      rangex1: 20,
      rangex2: 400,
      color: "red",
      strokeWidth: 7,
      deletable: true,
    }, options);

    return this.recordCall("createSection", options,
      new Section(
        this.desktop,
        options.length,
        options.x,
        options.y,
        options.rangex1,
        options.rangex2,
        options.color,
        options.strokeWidth,
        options.deletable
      ));
  }


  createCrescendo(options) {
    options = Object.assign({}, {
      width: 100,
      height: 40,
      x: 20,
      y: 20,
      color: '#e3e3e3',
      backgroundColor: '#ff5533',
      strokeWidth: 5,
      deletable: true
    }, options);

    return this.recordCall("createCrescendo", options,
      new Crescendo(
        this.desktop,
        options.width,
        options.height,
        options.x,
        options.y,
        options.color,
        options.backgroundColor,
        options.strokeWidth,
        options.deletable
      ));
  }

  createPie(options) {
    options = Object.assign({}, {
      width: 60,
      x: 40,
      y: 40,
      color: '#43e221',
      deletable: false,
      movable: true,
      parts: 4,
      label: "Pie Chart"
    }, options);

    return this.recordCall("createPie", options,
      new Pie(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.color,
        options.deletable,
        options.movable,
        options.parts,
        options.label
      ));
  }

  createLineChart(options) {
    options = Object.assign({}, {
      width: 60,
      x: 40,
      y: 40,
      color: '#43e221',
      dotNumber: 10,
      style: 1,
      moveHorizontal: false
    }, options);

    return this.recordCall("createLineChart", options,
      new LineChart(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.color,
        options.dotNumber,
        options.style,
        options.moveHorizontal
      ));
  }

  createCounter(options) {
    options = Object.assign({}, {
      width: 100,
      x: 100,
      y: 100,
      deletable: true,
      fixed: false
    }, options);

    return this.recordCall("createCounter", options,
      new Counter(
        this.desktop,
        options.width,
        options.x,
        options.y,
        options.deletable,
        options.fixed
      ));
  }

  createTextfield(options) {
    options = Object.assign({}, {
      text: '',
      width: 30,
      dragColor: 'red',
      dragAlpha: 0.5,
      x: 100,
      y: 100,
      textColor: 'black',
      backgroundColor: 'white',
      backgroundAlpha: 1,
      deletable: true,
      resizable: true,
      fitFont: true,
      fontSize: 14,
      font: "sans-serif",
      adjustable: false
    }, options);

    return this.recordCall("createTextfield", options,
      new Textfield(
        this.desktop,
        options.width,
        options.text,
        options.dragColor,
        options.dragAlpha,
        options.x,
        options.y,
        options.textColor,
        options.backgroundColor,
        options.backgroundAlpha,
        options.deletable,
        options.resizable,
        options.fitFont,
        options.fontSize,
        options.font,
        options.adjustable
      ));
  }

  createSpeechBubble(options) {
    options = Object.assign({}, {
      text: '',
      lockText: false,
      width: 30,
      backgroundColor: 'white',
      x: 100,
      y: 100,
      textColor: 'black',
      strokeColor: 'black',
      strokeWidth: 3,
      deletable: true,
      bubbleStyle: 0,
      font: "14px sans-serif",
      movable: true,
      adjustable: false
    }, options);

    return this.recordCall("createSpeechBubble", options,
      new SpeechBubble(
        this.desktop,
        options.width,
        options.text,
        options.lockText,
        options.backgroundColor,
        options.x,
        options.y,
        options.textColor,
        options.strokeColor,
        options.strokeWidth,
        options.deletable,
        options.bubbleStyle,
        options.font,
        options.movable,
        options.adjustable
      ));
  }


  createNumbering(options) {
    options = Object.assign({}, {
      value: 1,
      width: 20,
      x: 0,
      y: 0,
      backgroundColor: '#1E90FF',
      backgroundAlpha: 0.8,
      deletable: true,
      resizable: true,
      rotatable: true,
      regPoint: 1
    }, options);

    return this.recordCall("createNumbering", options,
      new Numbering(
        this.desktop,
        options.value,
        options.width,
        options.x,
        options.y,
        options.backgroundColor,
        options.backgroundAlpha,
        options.deletable,
        options.resizable,
        options.proportional,
        options.rotatable,
        options.regPoint
      ));
  }

  createTimeline(options) {
    options = Object.assign({}, {
      width: 100,
      height: 40,
      x: 100,
      y: 100,
      startSec: 0,
      sec: 120,
      increment: 5,
      timelineColor: '#000000',
      backgroundColor: '#e3e3e3'
    }, options);

    return this.recordCall("createTimeline", options,
      new Timeline(
        this.desktop,
        options.width,
        options.height,
        options.x,
        options.y,
        options.startSec,
        options.sec,
        options.increment,
        options.timelineColor,
        options.backgroundColor
      ));
  }

  createArrowConnection(options) {
    options = Object.assign({}, {}, options);
    return this.recordCall("createArrowConnection", options,
      new ArrowConnection(this.desktop));
  }

  createArrowNote(arrowOptions, noteOptions) {
    arrowOptions = Object.assign({}, {
      heads: 1,
      deletable: false
    }, arrowOptions);

    noteOptions = Object.assign({}, {
      deletable: true,
      resizable: true,
      fitFont: true
    }, noteOptions);

    // delete "persist" from options because we want to store
    // the whole call (createArrowNote).
    let persist = arrowOptions.persist;
    delete(arrowOptions.persist);
    delete(noteOptions.persist);

    let container = new ArrowConnection(this.desktop);
    let arrow = this.createArrow(arrowOptions);
    let note = this.createTextfield(noteOptions);
    container
      .addArrow(arrow)
      .addShape(note);

    // put flag back
    if (persist) {
      arrowOptions.persist = true;
      this.recordCall("createArrowNote", [arrowOptions, noteOptions], container);
    }

    return container;
  }

  createArrowDraggable(arrowOptions, shapeOptions) {
    arrowOptions = Object.assign({}, {
      heads: 1,
      deletable: false
    }, arrowOptions);

    shapeOptions = Object.assign({}, {
      rotate: false,
      rotationOffset: 0,
      pinable: false,
      mirror: false
    }, shapeOptions);

    // delete "persist" from options because we want to store
    // the whole call (createArrowDraggable).
    let persist = arrowOptions.persist;
    delete(arrowOptions.persist);
    delete(shapeOptions.persist);

    let container = new ArrowConnection(this.desktop);
    let arrow = this.createArrow(arrowOptions);
    let shape = this.createDraggable(shapeOptions);
    shape.created.then(() => {
      container.addArrow(arrow);
      container.addShape(shape, shapeOptions.rotate, shapeOptions.rotationOffset);
    });

    // put flag back
    if (persist) {
      arrowOptions.persist = true;
      this.recordCall("createArrowDraggable", [arrowOptions, shapeOptions], container);
    }

    return container;
  }


  createPieDraggable(pieOptions, shapeOptions) {
    pieOptions = Object.assign({}, {
      width: 60,
      x: 40,
      y: 40,
      color: '#43e221',
      deletable: false,
      movable: true,
      parts: 4
    }, pieOptions);

    shapeOptions = Object.assign({}, {
      rotate: false,
      rotationOffset: 0,
      pinable: false,
      mirror: false
    }, shapeOptions);

    let persist = pieOptions.persist;
    delete(pieOptions.persist);
    delete(shapeOptions.persist);

    let container = new PieConnection(this.desktop);
    let pie = this.createPie(pieOptions);
    let shape = this.createDraggable(shapeOptions);
    shape.created.then(() => {
      container.addPie(pie);
      container.addShape(shape, shapeOptions.rotate, shapeOptions.rotationOffset);
    });

    // put flag back
    if (persist) {
      pieOptions.persist = true;
      this.recordCall("createPieDraggable", [pieOptions, shapeOptions], container);
    }

    return container;
  }

  createPieNote(pieOptions, noteOptions) {
    pieOptions = Object.assign({}, {
      width: 60,
      x: 40,
      y: 40,
      color: '#43e221',
      deletable: false,
      movable: true,
      parts: 4
    }, pieOptions);

    noteOptions = Object.assign({}, {
      deletable: true,
      resizable: false,
      fitFont: false
    }, noteOptions);

    // delete "persist" from options because we want to store
    // the whole call (createPieNote).
    let persist = pieOptions.persist;
    delete(pieOptions.persist);
    delete(noteOptions.persist);

    let container = new PieConnection(this.desktop);
    let pie = this.createPie(pieOptions);
    let note = this.createTextfield(noteOptions);
    container
      .addPie(pie)
      .addShape(note);

    // put flag back
    if (persist) {
      pieOptions.persist = true;
      this.recordCall("createPieNote", [pieOptions, noteOptions], container);
    }

    return container;
  }

  createBgImage(options) {
    options = Object.assign({}, {
      src: '',
      width: 0, // 0 or unspecified: use original width of the image
      height: 0, // 0 or unspecified: use original height of the image
      x: 100,
      y: 100
    }, options);

    return this.recordCall("createBgImage", options,
      new BackgroundImage(
        this.desktop,
        options.src,
        options.width,
        options.height,
        options.x,
        options.y
      ));
  }

  createBgContainer(options) {
    options = Object.assign({}, {
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      color: 'red'
    }, options);

    return this.recordCall("createBgContainer", options,
      new BackgroundContainer(
        this.desktop,
        options.x,
        options.y,
        options.width,
        options.height,
        options.color
      ));
  }

  createColorPicker() {
    // the picker is a singleton.
    if (this.picker)
      return this.picker;
    else
      return this.picker = new ColorPicker(this.desktop);
  }


  createCroppedImage() {
    // the cropper is a singleton.
    if (this.crop)
      return this.crop;
    else
      return this.crop = new Crop(this.desktop);
  }

  createFreehandDrawing() {
    if (this.freehand)
      return this.freehand;
    else
      return this.freehand = new Freehand(this.desktop);
  }

  createDragDropExercise(options) {
    options = Object.assign({}, {
      cols: 5,
      sourceCols: 0,
      padding: 5,
      zonePadding: 5,
      dropPos: "topleft",
      dropPadding: 0,
      sourceWidth: 0,
      targetWidth: 0,
      sources: [],
      targets: [],
      debug: false,
      animationSpeed: 100
    }, options, {
      // overrides
      debug: defaultTo(Options.debug, false)
    });

    // explode sources pattern if it's not an array
    if (options.sources.pattern) {
      options.sources = Utils.explode(
        options.sources.pattern,
        options.sources.start,
        options.sources.end
      );
    }

    // ditto for targets
    if (options.targets.pattern) {
      options.targets = Utils.explode(
        options.targets.pattern,
        options.targets.start,
        options.targets.end
      );
    }

    return this.recordCall("createDragDropExercise", options,
      new DragDropExercise(
        this.desktop,
        options.cols,
        options.sourceCols,
        options.padding,
        options.zonePadding,
        options.dropPos,
        options.dropPadding,
        options.sourceWidth,
        options.targetWidth,
        options.sources,
        options.targets,
        options.debug,
        options.animationSpeed
      ));
  }

  createComplexDragDropExecise(options) {
    options = Object.assign({}, {
      model: {},
      targetImages: [],
      sourceImages: []
    }, options, {
      // overrides
      debug: defaultTo(Options.debug, false)
    });

    // explode sources pattern if it's not an array.
    // otherwise flatten the array one level deep and
    // enable the caller to intermix Utils.explode()
    // with other file names.
    if (options.sourceImages.pattern) {
      options.sourceImages = Utils.explode(
        options.sourceImages.pattern,
        options.sourceImages.start,
        options.sourceImages.end
      );
    } else {
      options.sourceImages = flatten(options.sourceImages);
    }

    // ditto
    if (options.targetImages.pattern) {
      options.targetImages = Utils.explode(
        options.targetImages.pattern,
        options.targetImages.start,
        options.targetImages.end
      );
    } else {
      options.targetImages = flatten(options.targetImages);
    }

    return this.recordCall("createComplexDragDropExecise", options,
      new ComplexDragDropExecise(
        this.desktop,
        options.model,
        options
      ));
  }

  createEditBox(options) {
    options = Object.assign({}, {
      text: '',
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      dragColor: 'red',
      dragAlpha: 0.5,
      movable: true,
      deletable: true,
      resizable: true
    }, options);

    return this.recordCall("createEditBox", options,
      new EditBox(this.desktop, options));
  }
}
