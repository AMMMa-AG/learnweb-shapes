/*
 * $Id: shape.js 47508 2019-03-12 13:49:48Z robertj $
 */

import {
  createjs
} from 'EaselJS';

/**
 * Base class of all shapes.
 */
export default class Shape {
  /**
   * Gets the shape's class name as a string.
   *
   * We need this because "Shape.constructor.name" (or any other
   * way of getting the name) is mangled during the build process.
   */
  get shapeClassName() {
    return "Shape";
  }

  constructor(desktop) {
    this.desktop = desktop;
    this._container = new createjs.Container();
    this._container.id = this.desktop.getUID();
    this._container.visible = this.load('vis', true);
    this.tag = null;
    this.created = this.desktop.announceShape(this);
  }

  /**
   * Returns the layer() constant which specifies that
   * a shape is a background shape.
   */
  static get BackgroundLayer() {
    return 0;
  }

  /**
   * Returns the layer() constant which specifies that
   * a shape is an image shape.
   */
  static get ImageLayer() {
    return 1;
  }

  /**
   * Returns the layer() constant which specifies that
   * a shape is a tool.
   */
  static get ToolLayer() {
    return 2;
  }

  /**
   * Gets the EaselJS container.
   */
  get container() {
    return this._container;
  }

  /**
   * Gets the unique ID of this shape.
   */
  get id() {
    return this.container.id;
  }

  /**
   * gets the EaselJS stage.
   */
  get stage() {
    return this.desktop.stage;
  }

  get hasDeleter() {
    if (!this.adjustable) {
      return !!this.deletable;
    } else {
      return !this.deletable;
    }
  }

  get hasExpander() {
    return !!this.resizable;
  }

  get hasRotator() {
    return !!this.rotatable;
  }

  get hasSettings() {
    return !!this.adjustable;
  }

  get hasPinner() {
    return !!this.pinable;
  }

  get hasMirror() {
    return !!this.mirror;
  }

  /**
   * Gets the visibility of the shape.
   */
  get visible() {
    return this.container.visible;
  }

  /**
   * Sets the visibility of the shape.
   */
  set visible(value) {
    this.container.visible = value;
    this.dispatchEvent("visiblechanged");
  }

  /**
   * returns the Z-Index layer constant of this shape.
   */
  get layer() {
    return -1;
  }

  /**
   * Gets the position of the deleter of this shape.
   */
  get deleterPos() {
    const container = this.container;
    if (this.regPoint == 0) {
      if (container.scaleX == 1) {
        return {
          x: container.x,
          y: container.y
        };
      } else {
        return {
          x: container.x - container.cwidth,
          y: container.y
        };
      }
    } else {
      return {
        x: container.x - container.cwidth / 2,
        y: container.y - container.cheight / 2
      };
    }
  }

  /**
   * Gets the position of the expander of this shape.
   */
  get expanderPos() {
    const container = this.container;

    if (this.regPoint == 0) {
      if (container.scaleX == 1) {
        return {
          x: container.x + container.cwidth,
          y: container.y + container.cheight
        };
      } else {
        return {
          x: container.x,
          y: container.y + container.cheight
        };
      }
    } else {
      return {
        x: container.x + container.cwidth / 2,
        y: container.y + container.cheight / 2
      }
    }
  }

  /**
   * Gets the position of the rotator of this shape.
   */
  get rotatorPos() {
    const container = this.container;

    if (this.regPoint == 0) {
      return {
        x: container.x + container.cwidth,
        y: container.y
      };
    } else {
      return {
        x: container.x + container.cwidth / 2,
        y: container.y - container.cheight / 2
      }
    }
  }

  /**
   * Gets the position of the pinner of this shape.
   */
  get pinnerPos() {
    const container = this.container;

    if (this.regPoint == 0) {
      return {
        x: container.x,
        y: container.y + container.cheight
      };
    } else {
      return {
        x: container.x - container.cwidth / 2,
        y: container.y + container.cheight / 2
      }
    }
  }

  /**
   * Gets the position of the settingsIcon of this shape.
   */
  get settingsPos() {
    const container = this.container;
    if (this.regPoint == 0) {
      if (container.scaleX == 1) {
        return {
          x: container.x,
          y: container.y
        };
      } else {
        return {
          x: container.x - container.cwidth,
          y: container.y
        };
      }
    } else {
      return {
        x: container.x - container.cwidth / 2,
        y: container.y - container.cheight / 2
      };
    }
  }

  /**
   * Gets the position of the mirror icon of this shape.
   */
  get mirrorPos() {
    const container = this.container;

    if (this.regPoint == 0) {
      if (container.scaleX == 1) {
        return {
          x: container.x + container.cwidth,
          y: container.y
        };
      } else {
        return {
          x: container.x - container.cwidth,
          y: container.y + container.cheight
        };
      }
    } else {
      return {
        x: container.x + container.cwidth / 2,
        y: container.y - container.cheight / 2
      }
    }
  }

  /**
   * Returns the container's bounds. Might be null!
   * Might be null (see createjs.DisplayObject.getBounds()).
   *
   * @returns {createjs.Rectangle}
   */
  getBounds() {
    return this.container.getBounds();
  }

  /**
   * Returns the container's bounds in stage coordinates.
   * Might be null (see getBounds()).
   *
   * @returns {createjs.Rectangle}
   */
  getStageBounds() {
    const rect = this.getBounds();
    if (!rect) return null;
    const point = this.container.localToStage(rect.x, rect.y);
    rect.x = point.x;
    rect.y = point.y;
    return rect;
  }

  /**
   * Gets the location of the shape as a point.
   *
   * @returns {createjs.Point}
   */
  get location() {
    return new createjs.Point(this.container.x, this.container.y);
  }

  /**
   * See Desktop.store(). Fluent.
   *
   * @param {string} name
   * @param {*} value
   */
  store(name, value) {
    this.desktop.store(this, name, value);
    return this;
  }

  /**
   * See Deskop.storeObject(). Fluent.
   * @param {string} name
   * @param {Shape} value
   */
  storeObject(name, value) {
    this.desktop.storeObject(this, name, value);
    return this;
  }

  /**
   * See Desktop.load()
   *
   * @param {string} name
   * @param {*} defaultValue
   */
  load(name, defaultValue) {
    return this.desktop.load(this, name, defaultValue);
  }

  /**
   * See Desktop.loadObject.
   *
   * @param {string} name
   * @param {*} type
   * @param {Shape} defaultValue
   */
  loadObject(name, type, defaultValue) {
    return this.desktop.loadObject(this, name, type, defaultValue);
  }

  /**
   * Initializes the shape by invoking its create(), afterCreate() etc. methods.
   */
  init() {
    this.create();
    this.desktop.addShape(this);
    this.desktop.update();
    this.afterCreate();
    this.dispatchEvent("created");
    this.focus();
    this.blur();
  }

  /**
   * Focusizes this shape.
   */
  focus() {
    this.desktop.focus(this);
  }

  /**
   * Blurs the shape. Note that this only has an effect if this shape
   * is currently focused.
   */
  blur() {
    this.desktop.blur();
  }

  /**
   * Moves the shape by the specified x, y values.
   *
   * @param {number} x
   * @param {number} y
   */
  moveBy(x, y) {
    this.desktop.moveContainer(this, x, y);
  }

  /**
   * Moves the shape to the specified x, y values.
   *
   * @param {number} x
   * @param {number} y
   */
  moveTo(x, y) {
    this.desktop.moveContainerTo(this, x, y);
  }

  /**
   * Moves the shape to the specified x, y values with animation.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} [speed = 200]
   *
   * @returns {Promise}
   */
  moveAnimated(x, y, speed = 200) {
    if (speed <= 0) {
      this.moveTo(x, y);
      return Promise.resolve();
    }

    return this.desktop.animate(
      createjs.Tween
      .get(this.container)
      .setPaused(true)
      .to({
        x,
        y
      }, speed, createjs.Ease.quadInOut)
      .call(() => this.moveTo(x, y))
    );
  }

  /**
   * Overrided classes should create the shape an its dependend visual
   * objects here.
   */
  create() {}

  /**
   * Invoked after the shape has been created and appended to the stage.
   */
  afterCreate() {}

  /**
   * Invoked before the shape is resized.
   */
  beforeResize(evt) {}

  /**
   * invoked when the shape is resized by the specified amount (evt.x, evt.y).
   */
  resizeBy(evt) {}

  /*
   * resizes the shape. FIXME: rework resizeBy/resizeTo.
   */
  resizeTo(width, height) {
    this.resizeBy({
      x: width - this.container.cwidth,
      y: height - this.container.cheight
    });
  }

  /**
   * Invoked when the shape is moved
   */
  moved() {}

  /**
   * Invoked when the shape gets the focus.
   */
  onFocus() {
    this.focused = true;
  }

  /**
   * Invoked when the shape loses the focus.
   */
  onBlur() {
    this.focused = false;
  }

  /**
   * Moves the shape to the top (z-index-wise).
   */
  moveToTop() {
    this.container.moveToTop();
  }

  /**
   * Moves the shape to the bottom (z-index-wise).
   */
  moveToBottom() {
    this.container.moveToBottom();
  }

  /**
   * Invoked when the shape is removed.
   */
  remove() {
    let container = this.container;
    this.desktop.blur();
    this.desktop.clearShapeStorage(this);
    if (container.parent) {
      container.parent.removeChild(container);
      this.dispatchEvent("deleted");
      this.desktop.dispatchEvent("desktop:shapedeleted");
      this.desktop.dispatchEvent("desktop:shapeschanged");
    }
  }

  /**
   * Gets a map of shape to storage keys.
   * For example, if you're going to store the factory property
   * "width" as "w" then make shapeToStorageMap return { "width": "w"}.
   *
   * FIXME: this is preliminary.
   */
  get shapeToStorageMap() {
    return {};
  }

  /**
   * Invoked when the shape should store its state.
   */
  persist() {
    this.store('vis', this.container.visible);
  }

  /**
   * Invoked when the shape should be mirrored.
   */
  mirrorObject() {}

  /**
   * Returns the properties that this shape allows to be updated
   * after the shape has been created.
   */
  get properties() {
    return []
  }

  /**
   * Sets the property values from the specified object.
   *
   * @param {object} props
   */
  setProperties(props = {}) {
    for (let name of this.properties) {
      let value = props[name];
      if (value != undefined) {
        this[name] = value;
      }
    }
    this.redraw();
    this.desktop.update();
  }

  /**
   * Invoked when the settings of the shape should be displayed.
   */
  showSettings() {
    let contextMenu = this.desktop.contextMenu;
    contextMenu.setVisible(!contextMenu.isVisible());
    contextMenu.setPosition(5, 5);
    this.stage.update();
  }

  /**
   * Invoked when the shape should redraw itself.
   */
  redraw() {}
}

// add EventDispatcher capabilities
createjs.EventDispatcher.initialize(Shape.prototype);
