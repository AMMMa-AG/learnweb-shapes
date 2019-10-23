/*
 * $Id: dragdrop.js 44246 2018-02-21 16:42:22Z robertj $
 */

import Shape from '../shape';
import BackgroundImage from '../backgroundimage';
import Draggable from '../draggable';
import shuffle from 'lodash/shuffle';

export default class DragDropExecise extends Shape {
  /**
   * Creates a new instance of DragDropExecise.
   *
   * @param {number} cols: hom many columns.
   * @param {number} sourceCols: hom many columns for the sources.
   * @param {number} padding: cell padding. applied to all sides of the cell.
   * @param {number} zonePadding: extra padding between targets & sources.
   * @param {string} dropPos: drop position ("topleft", "bottomcenter", "bottomleft").
   * @param {number} dropPadding: padding for dropPos.
   * @param {number} sourceWidth
   * @param {number} targetWidth
   * @param {Array} sources: draggable source images.
   * @param {Array} targets: drop target images.
   * @param {boolean} debug: turn on labels for debugging purposes.
   */
  constructor(desktop, cols, sourceCols, padding, zonePadding, dropPos, dropPadding, sourceWidth, targetWidth, sources, targets, debug, animationSpeed) {
    super(desktop);
    this.cols = cols;
    this.sourceCols = sourceCols || cols;
    this.padding = padding;
    this.zonePadding = zonePadding;
    this.dropPos = dropPos;
    this.dropPadding = dropPadding;
    this.sourceWidth = sourceWidth;
    this.targetWidth = targetWidth;
    this.sources = sources;
    this.targets = targets;
    this.debug = debug;
    this.animationSpeed = animationSpeed;
    this.sourceShapes = [];
    this.targetShapes = [];

    // compute and store a random permutation.
    this.shuffled = this.load("S", null);
    if (!this.shuffled) {
      this.shuffled = new Array(this.sources.length);
      for (let i = 0; i < this.sources.length; i++)
        this.shuffled[i] = i;
      this.shuffled = shuffle(this.shuffled);
      this.store("S", this.shuffled);
    }

    // shuffle sources
    let shuffledSources = new Array(this.sources.length);
    for (let i = 0; i < this.sources.length; i++)
      shuffledSources[i] = this.sources[this.shuffled[i]];
    this.sources = shuffledSources;

    // load persisted indexes, if any
    this.persistedIndexes = this.load("I", []);

    this.init();
  }

  get layer() {
    return Shape.ImageLayer;
  }

  /**
   * Returns the approximative width of a cell.
   */
  get approxWidth() {
    return (this.desktop.width - (this.cols * 2 * this.padding)) / this.cols
  }

  /**
   * Returns the approximative width of a cell.
   */
  get approxSourceWidth() {
    return this.sourceWidth
      ? this.sourceWidth
      : (this.desktop.width - (this.sourceCols * 2 * this.padding)) / this.sourceCols;
  }

  /**
   * Initializes the object. Fully overriden from Shape because
   * our create() is asynchonous.
   */
  init() {
    this.create().then(() => {
      this.desktop.addShape(this);
      this.desktop.update();
      this.afterCreate();
      this.dispatchEvent("created");
    });
  }

  /**
   * Creates the exercise.
   *
   * @returns {Promise}
   */
  create() {
    return new Promise((resolve) => {
      // create targets first ...
      this.createTargets().then(() => {
        // compute max y position of the target shapes
        let maxy = this.targetShapes.max((elem) => {
          return elem.container.y + elem.container.getBounds().height;
        });
        // ... then create the sources, padded accordingly.
        this.createSources(maxy + this.zonePadding).then(resolve);
      });
    });
  }

  /**
   * Creates the drop target shapes.
   */
  createTargets() {
    const list = this.targets;
    const shapeList = this.targetShapes;
    const promises = [];

    for (let i = 0; i < list.length; i++) {
      let x, y;
      ({ x, y } = this.desktop.randomPoint);

      let shape = new BackgroundImage(
        this.desktop,
        list[i],
        this.approxWidth,
        0,
        x,
        y
      );

      shape.index = i;
      shapeList.push(shape);

      // await "created" and align.
      let p = new Promise((resolve) => {
        shape.created.then(() => {
          this.alignShape(shape, i, 0).then(resolve)
        });
      });

      promises.push(p);
    }

    return Promise.all(promises);
  }

  /**
   * Creates the source (draggable) shapes.
   *
   * @param {number} paddingTop: amount of padding to the to of the stage.
   */
  createSources(paddingTop) {
    const list = this.sources;
    const shapeList = this.sourceShapes;
    const promises = [];
    const hasIndexes = this.persistedIndexes.length > 0;

    for (let i = 0; i < list.length; i++) {
      let x, y;
      ({ x, y } = this.desktop.randomPoint);

      let shape = new Draggable(
        this.desktop,
        list[i],
        this.approxSourceWidth,
        0,
        x,
        y,
        this.debug ? (this.shuffled[i] + 1).toString() : "",
        this.debug ? "white" : undefined,
        false,
        false,
        false,
        0,
        Shape.ImageLayer,
        false
      );

      shape.index = i;
      shapeList.push(shape);

      shape.container.on("endmove", () => this.drop(shape));

      // await "created" and align shape.
      let p = new Promise((resolve) => {
        shape.created.then(() => {
          // restore?
          if (hasIndexes && this.persistedIndexes[i] >= 0) {
            // don't move, just align
            this.alignSource(shape, i, paddingTop, true)
              .then(() => this.drop(shape).then(resolve));
          } else {
            this.alignSource(shape, i, paddingTop).then(resolve);
          }
        });
      });

      promises.push(p);
    }

    return Promise.all(promises);
  }

  /**
   * Aligns a shape to the grid.
   *
   * @param {Shape} shape: the shape.
   * @param {number} index: shape index.
   * @param {number} paddingTop: padding to the top of the stage.
   * @param {boolean=false} dontMove: prevent moving, calculate only.
   *
   * @returns {Promise}
   */
  alignShape(shape, index, paddingTop, dontMove = false) {
    let row = Math.floor(index / this.cols);
    let col = index % this.cols;

    let bounds = shape.container.getBounds();

    let x = this.padding + (this.approxWidth + 2 * this.padding) * col;
    let y = paddingTop + this.padding + (bounds.height + 2 * this.padding) * row;

    shape.originalX = x;
    shape.originalY = y;

    if (dontMove)
      return Promise.resolve();

    return shape.moveAnimated(x, y, this.animationSpeed);
  }

  alignSource(shape, index, paddingTop, dontMove = false) {
    let row = Math.floor(index / this.sourceCols);
    let col = index % this.sourceCols;

    let bounds = shape.container.getBounds();

    let x = this.padding + (this.approxSourceWidth + 2 * this.padding) * col;
    let y = paddingTop + this.padding + (bounds.height + 2 * this.padding) * row;

    shape.originalX = x;
    shape.originalY = y;

    if (dontMove)
      return Promise.resolve();

    return shape.moveAnimated(x, y, this.animationSpeed);
  }

  /**
   * Drops the shape if possible.
   *
   * @param {Shape} shape
   * @returns {Promise}
   */
  drop(shape) {
    let target = this.findDropTarget(shape);

    // delete a previous dropTarget
    if (shape.dropTarget) {
      delete shape.dropTarget.visitor;
      delete shape.dropTarget;
    }

    if (target && !target.visitor) {
      shape.dropTarget = target;
      shape.dropTarget.visitor = shape;

      let x, y;
      let targetRect = target.getBounds();
      let shapeRect = shape.getBounds();

      switch (this.dropPos) {
        case "bottomleft":
          x = target.container.x + this.dropPadding;
          y = target.container.y + targetRect.height - shapeRect.height - this.dropPadding;
          break;
        case "bottomcenter":
          x = target.container.x + targetRect.width / 2 - shapeRect.width / 2;
          y = target.container.y + targetRect.height - shapeRect.height - this.dropPadding;
          break;
        case "topleft":
        default:
          x = target.container.x + this.dropPadding;
          y = target.container.y + this.dropPadding;
          break;
      }
      return shape.moveAnimated(x, y, this.animationSpeed);
    } else {
      return shape.moveAnimated(shape.originalX, shape.originalY, this.animationSpeed);
    }
  }

  /**
   *  Finds the drop target under the shape, if any.
   *
   * @param {Shape} shape
   * @returns {Shape}
   */
  findDropTarget(shape) {
    const sourceRect = shape.getStageBounds();
    const sourceArea = sourceRect.width * sourceRect.height;

    for (let i = 0; i < this.targetShapes.length; i++) {
      let target = this.targetShapes[i];
      const targetRect = target.getStageBounds();
      const intersectionRect = targetRect.intersection(sourceRect);
      if (!intersectionRect)
        continue;
      const area = intersectionRect.width * intersectionRect.height;
      if (area >= sourceArea * 0.5)
        return target;
    }

    return undefined;
  }

  /**
   * Checks the evaluation of the exercise.
   *
   * @returns {Promise}: resolve args: {valid, complete, success}.
   */
  check() {
    let completed = true;
    let valid = true;
    let promises = [];

    for (let i = 0; i < this.targetShapes.length; i++) {
      let target = this.targetShapes[i];
      let visitor = target.visitor;
      if (visitor) {
        if (this.shuffled[visitor.index] !== i) {
          valid = false;
          delete target.visitor;
          delete visitor.dropTarget;

          let p = visitor.moveAnimated(visitor.originalX, visitor.originalY, this.animationSpeed);
          promises.push(p);
        }
      } else {
        completed = false;
      }
    }

    return new Promise((resolve) => {
      Promise.all(promises).then(() => {
        resolve({ valid, completed, success: valid && completed });
      })
    });
  }

  /**
   * Mark exercise as solved by making the source shapes
   * unmovable.
   */
  solve() {
    this.sourceShapes.forEach((shape) => shape.movable = false);
    this.store("s", true);
  }

  /**
   * Whether the exercise is solved.
   */
  get solved() {
    return this.load("s", false);
  }

  /**
   * Persists the evaluation results.
   */
  persist() {
    super.persist();
    let indexes = [];
    this.sourceShapes.forEach((shape, index) => {
      if (shape.dropTarget)
        indexes.push(shape.dropTarget.index);
      else
        indexes.push(-1);
    });
    this.store("I", indexes);
  }
}
