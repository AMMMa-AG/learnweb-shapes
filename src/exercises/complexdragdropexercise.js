/*
 * $Id: complexdragdropexercise.js 44246 2018-02-21 16:42:22Z robertj $
 */
import Shape from '../shape';
import DragDropModel from './dragdropmodel';
import Layouts from '../layouts/index.js';
import Utils from '../utils';

export default class ComplexDragDropExecise extends Shape {
  /**
   * TODO: document.
   *
   * @param {Object} desktop
   * @param {Object} modelOptions: @see DragDropModel.
   * @param {Object} options
   */
  constructor(desktop, modelOptions, options) {
    super(desktop);

    options = Object.assign({}, {
      debug: false,
      multiDrop: false,
      overlappingFactor: 0.5,
      animationSpeed: 100,

      targetLayout: 'FlowLayout',
      targetLayoutOptions: {},

      sourceLayout: 'FlowLayout',
      sourceLayoutOptions: {},

      targetLayoutShapeOptions: {},
      sourceLayoutShapeOptions: {},

      targetImageWidth: 100,
      targetImageHeight: 0,
      sourceImageWidth: 100,
      sourceImageHeight: 0,

      targetImages: [],
      sourceImages: [],

      targetInnerLayout: 'StackLayout',
      targetInnerLayoutOptions: {},
    }, options);

    let commonLayoutOptions = {
      animationSpeed: options.animationSpeed
    };

    Object.assign(options.sourceLayoutOptions, commonLayoutOptions);
    Object.assign(options.targetLayoutOptions, commonLayoutOptions);
    Object.assign(options.targetInnerLayoutOptions, commonLayoutOptions);

    this.options = options;
    this.model = new DragDropModel(modelOptions);
    this.model.set(this.load("R", null));
    this.permutation = this.load("P",
      options.permute === "identity"
        ? Utils.getIdentityArray(this.model.sources)
        : Utils.getPermutation(this.model.sources));
    this.init();
  }

  get layer() {
    return Shape.BackgroundLayer;
  }

  create() {
    this.createTargets().then(() => this.createSources().then(() => {
      this.restore();
    }));
  }

  /**
   * Creates the target background, layout, shapes and their inner layouts.
   *
   * @returns {Promise} which is resolved after all shapes were positioned.
   */
  createTargets() {
    const options = this.options;
    const factory = this.desktop.factory;

    // chose between createBgImage/Container
    let layoutCtor = (options.targetLayoutShapeOptions.src ? factory.createBgImage
      : factory.createBgContainer).bind(factory);

    // create layout shape
    this.targetLayoutShape = layoutCtor(options.targetLayoutShapeOptions);

    // chose layout classes
    let targetLayoutClass = Layouts[options.targetLayout];
    let targetInnerLayoutClass = Layouts[options.targetInnerLayout];

    // create layout
    this.targetLayout = new targetLayoutClass(this.targetLayoutShape, options.targetLayoutOptions);

    // create target images with their layouts
    this.innerLayouts = new Map();
    this.targetShapes = [];
    options.targetImages.forEach((src, index) => {
      let p = this.desktop.randomPoint;

      // check whether we can position the target inside the layout
      let opt = options.targetLayoutShapeOptions;
      let width = options.targetImageWidth;
      if (opt.width && opt.height) {
        p.x = opt.x + Math.random() * (opt.width - width);
        p.y = opt.y + Math.random() * (opt.height - 20);
      }

      // check whether "src" is a Shape instance and use it as is.
      // otherwise create a draggable from src.
      let img = src instanceof Shape ? src : factory.createDraggable({
        path: src,
        width: options.targetImageWidth,
        height: options.targetImageHeight,
        x: p.x,
        y: p.y,
        labelText: options.debug ? this.model.expectsToString(index) : undefined,
        labelColor: options.targetLabelColor || 'white',
        resizable: false,
        deletable: false,
        rotatable: false,
        pinable: false,
        regPoint: 0
      });

      img.movable = false;
      img.focusable = false;

      // store target index
      img.tag = index;
      this.targetLayout.add(img);

      // create and memorize inner layout
      let layout = new targetInnerLayoutClass(img, options.targetInnerLayoutOptions);
      this.innerLayouts.set(img, layout);

      this.targetShapes.push(img);
    });
    return this.targetLayout.align();
  }

  /**
   * Creates the source background, layout and shapes.
   *
   * @returns {Promise} which is resolved after all shapes were positioned.
   */
  createSources() {
    const options = this.options;
    const factory = this.desktop.factory;

    // chose between createBgImage and createBgContainer
    let layoutCtor = (options.sourceLayoutShapeOptions.src ? factory.createBgImage
      : factory.createBgContainer).bind(factory);

    // create layout shapes
    this.sourceLayoutShape = layoutCtor(options.sourceLayoutShapeOptions);

    // chose layout classes
    let sourceLayoutClass = Layouts[options.sourceLayout];

    // create layout
    this.sourceLayout = new sourceLayoutClass(this.sourceLayoutShape, options.sourceLayoutOptions);

    this.sourceShapes = [];
    this.endmoveHandlers = new Map();

    // create source images
    Utils.permutedForEach(options.sourceImages, this.permutation, (src, index) => {
      let p = this.desktop.randomPoint;

      // check whether we can position the source inside the layout
      let opt = options.sourceLayoutShapeOptions;
      let width = options.sourceImageWidth;
      if (opt.width && opt.height) {
        p.x = opt.x + Math.random() * (opt.width - width);
        p.y = opt.y + Math.random() * (opt.height - 20);
      }

      // check whether "src" is a Shape instance and use it as is.
      // otherwise create a draggable from src.
      let img = src instanceof Shape ? src : factory.createDraggable({
        path: src,
        width: options.sourceImageWidth,
        height: options.sourceImageHeight,
        x: p.x,
        y: p.y,
        labelText: options.debug ? index.toString() : undefined,
        labelColor: options.sourceLabelColor || 'white',
        resizable: false,
        deletable: false,
        rotatable: false,
        pinable: false,
        regPoint: 0
      });

      // store source index into shape's general purpose tag property
      img.tag = index;
      this.sourceLayout.add(img);

      // monitor shape's "endmove" and try to drop.
      img.created.then(() => {
        this.endmoveHandlers.set(img, img.container.on("endmove", () => {
          this.tryDrop(img);
        }));
      });

      this.sourceShapes.push(img);
    });

    return this.sourceLayout.align();
  }

  /**
   * Drops the specified shape onto the underlying target, if possible.
   *
   * @param {Shape} sourceShape
   * @param {Shape} [targetShape=null]
   * @returns {Promise} which resolves after all shapes were positined.
   */
  tryDrop(sourceShape, targetShape = null) {
    // check whether source is about to be dropped back onto the source layout
    if (!targetShape && !this.sourceLayout.contains(sourceShape)) {
      let targetShape = this.findDropTarget(sourceShape, [this.sourceLayoutShape]);
      if (targetShape) {
        return this.undropShape(sourceShape, targetShape);
      }
    }

    targetShape = targetShape || this.findDropTarget(sourceShape, this.targetShapes);
    if (!targetShape) return Promise.resolve();

    let canDrop = this.options.multiDrop ||
      this.model.canDrop(sourceShape.tag, targetShape.tag);

    if (canDrop)
      return this.dropShape(sourceShape, targetShape);

    return Promise.resolve();
  }

  /**
   * Drops a source shape into a target shape.
   * Updates the DragDropModel as well.
   *
   * @param {Shape} sourceShape
   * @param {Shape} targetShape
   * @returns {Promise}
   */
  dropShape(sourceShape, targetShape) {
    this.model.drop(sourceShape.tag, targetShape.tag);

    let promises = [];
    if (this.sourceLayout.contains(sourceShape)) {
      promises.push(this.sourceLayout.remove(sourceShape, true));
    }

    this.innerLayouts.forEach(layout => {
      if (layout.contains(sourceShape)) {
        promises.push(layout.remove(sourceShape, true));
      }
    });

    let layout = this.innerLayouts.get(targetShape);
    promises = promises.concat(layout.add(sourceShape, true));
    return Promise.all(promises);
  }

  /**
   * Undrops source shape from target shape.
   * Updates the DragDropModel as well.
   *
   * @param {Shape} sourceShape
   * @param {Shape} targetShape
   * @returns {Promise}
   */
  undropShape(sourceShape, targetShape) {
    this.model.undropSource(sourceShape.tag);
    let promises = [];

    // remove shape from the inner layout of its current target
    this.innerLayouts.forEach(layout => {
      if (layout.contains(sourceShape)) {
        promises.push(layout.remove(sourceShape, true));
      }
    });

    // add to source layout
    promises = promises.concat(this.sourceLayout.add(sourceShape, true));
    return Promise.all(promises);
  }


  /**
   * Finds the drop target under the specified @sourceShape.
   * Returns undefined if no such target was found.
   *
   * @param {Shape} sourceShape
   * @param {Array} targets: which shapes to consider as targets.
   * @returns {Shape}
   */
  findDropTarget(sourceShape, targets) {
    let sourceRect = sourceShape.getStageBounds();
    let sourceArea = sourceRect.width * sourceRect.height;

    for (let i = 0; i < targets.length; i++) {
      let target = targets[i];
      const targetRect = target.getStageBounds();
      const intersectionRect = targetRect.intersection(sourceRect);
      if (!intersectionRect)
        continue;
      const area = intersectionRect.width * intersectionRect.height;
      if (area >= sourceArea * this.options.overlappingFactor)
        return target;
    }

    return undefined;
  }

  /**
   * Restores the source shapes visually to match the current model.
   */
  restore() {
    this.sourceShapes.forEach(sourceShape => {
      let targetId = this.model.targetOf(sourceShape.tag);
      let targetShape = this.targetShapes.find(item => item.tag == targetId);
      if (targetShape) {
        this.model.undropSource(sourceShape.tag);
        this.tryDrop(sourceShape, targetShape);
      }
    });
  }

  /**
   * Checks whether the exercise is completed correctly.
   *
   * @returns {Promise}: resolve args: {valid, complete, success, count, maxCount}.
   */
  check() {
    let valid = true;
    let count = 0;
    let maxCount = 0;
    let promises = [];

    this.targetShapes.forEach(targetShape => {
      maxCount++;
      let targetId = targetShape.tag;
      if (this.model.checkTarget(targetId)) {
        count++;
      } else {
        valid = false;
        this.model.sourcesOf(targetId).forEach(sourceId => {
          // source valid? do nothing.
          if (this.model.checkSource(sourceId))
            return;

          let sourceShape = this.sourceShapes.find(item => item.tag == sourceId);
          if (sourceShape) {
            promises.push(this.undropShape(sourceShape, targetShape));
          } else {
            this.model.undrop(sourceId, targetId);
            console.log(`invalid source shape id "${sourceId}"`);
          }
        });
      }
    });

    let completed = valid && count == maxCount;
    return Promise.all(promises).then(() =>
      Promise.resolve({
        success: valid && completed,
        valid,
        completed,
        count,
        maxCount
      })
    );
  }

  /**
   * Mark exercise as solved by making the source shapes
   * unmovable.
   */
  solve() {
    this.sourceShapes.forEach(shape => shape.movable = false);
    this.store("s", true);
  }

  /**
   * Whether the exercise is solved.
   */
  get solved() {
    return this.load("s", false);
  }

  /**
   * Persists the permutation & the model's results.
   */
  persist() {
    super.persist();
    this.store("R", this.model.result);
    this.store("P", this.permutation);
  }
}
