/*
 * $Id: createjs.js 42461 2017-07-31 12:28:55Z robertj $
 *
 * CreateJS extensions.
 */

import { createjs } from 'EaselJS';

/*
 * createjs.DisplayObject extensions.
 */
Object.assign(createjs.DisplayObject.prototype, {
  /**
   * Moves the display object to top (z-index wise).
   */
  moveToTop() {
    if (this.parent)
      this.parent.addChild(this);
  },

  /**
   * Moves the display object to bottom (z-index wise).
   */
  moveToBottom() {
    if (this.parent)
      this.parent.addChildAt(this, 0);
  },

  /**
   * Transforms the specified x, y position from the coordinate
   * space of this display object to the coordinate space of the
   * stage display object.
   *
   * This method should be use in place of localToGlobal() when
   * no absolute mouse or other browser-related coordinates are involved.
   *
   * @param {number} x
   * @param {number} y
   * @param {createjs.Point} [pt=undefined]
   * @returns {createjs.Point}
   */
  localToStage(x, y, pt = undefined) {
    return this.localToLocal(x, y, this.stage, pt);
  },

  /**
   * Transforms the specified x, y position from the coordinate
   * space of the stage display object to the coordinate space of
   * this display object.
   *
   * This method should be use in place of globalToLocal() when
   * no absolute mouse or other browser-related coordinates are involved.
   *
   * @param {number} x
   * @param {number} y
   * @param {createjs.Point} [pt=undefined]
   * @returns {createjs.Point}
   */
  stageToLocal(x, y, pt = undefined) {
    return this.stage.localToLocal(x, y, this, pt);
  },

  /**
   * Transforms the x, y position of this object into
   * the coordinate space of the specified target object.
   *
   * @param {createjs.DisplayObject} target
   */
  positionToLocal(target) {
    // note that we use parent because x, y are specified
    // in parent's coordinate space.
    return this.parent.localToLocal(this.x, this.y, target.parent);
  },
});

/*
 * createjs.Text extensions.
 */
Object.assign(createjs.Text.prototype, {
  /**
   * Returns better text metrics than getMeasuredWidth/Height().
   * Fixes a calculation issue with line feeds.
   */
  getTextMetrics() {
    let width = this.getMeasuredWidth();
    let height = this.getMeasuredHeight();

    if (this.text && this.text.match(/\n/)) {
      const bounds = this.getBounds();
      if (bounds) width = bounds.width;
    }

    return {
      width,
      height
    }
  }
});

/*
 * createjs.DOMElement extensions.
 */
Object.assign(createjs.DOMElement.prototype, {
  /**
   * Fixes 2 issues of the original createjs.DOMElement._handleDrawEnd():
   *
   * - the positioning of the HTML element was off. The original implementation
   *   assumes that the canvas is full-screen at (0, 0) and doesn't consider
   *   canvas' offsets. We fix this by modifying the transformation matrix.
   *
   * - window.devicePixelRatio isn't considered. We fix this by exposing
   *   "stage.pixelRatio" and unscale the transformation matrix accordingly.
   *
   * @param {*} evt
   */
  _handleDrawEnd(evt) {
    let o = this.htmlElement;
    if (!o) { return; }
    let style = o.style;

    let props = this.getConcatenatedDisplayProps(this._props);
    let mtx = props.matrix;

    let visibility = props.visible ? "visible" : "hidden";
    if (visibility != style.visibility) { style.visibility = visibility; }
    if (!props.visible) { return; }

    let oldProps = this._oldProps;
    let oldMtx = oldProps && oldProps.matrix;
    let n = 10000; // precision

    if (!oldMtx || !oldMtx.equals(mtx)) {
      // get ratio from stage where it was stored by us (see desktop.js).
      let f = 1 / (this.stage.pixelRatio || 1);

      // unscale matrix and its translation
      mtx = mtx.clone().scale(f, f);
      mtx.tx *= f;
      mtx.ty *= f;

      // position HTML element relative to the canvas HTML element.
      mtx.tx += this.stage.canvas.offsetLeft;
      mtx.ty += this.stage.canvas.offsetTop;

      let str = "matrix(" + (mtx.a * n | 0) / n + "," + (mtx.b * n | 0) / n + "," + (mtx.c * n | 0) / n + "," + (mtx.d * n | 0) / n + "," + (mtx.tx + 0.5 | 0);
      style.MozTransform = str + "px," + (mtx.ty + 0.5 | 0) + "px)";
      style.transform =
        style.WebkitTransform =
        style.OTransform =
        style.msTransform = str + "," + (mtx.ty + 0.5 | 0) + ")";

      if (!oldProps) {
        oldProps = this._oldProps = new createjs.DisplayProps(true, null);
      }
      oldProps.matrix.copy(mtx);
    }

    if (oldProps.alpha != props.alpha) {
      style.opacity = "" + (props.alpha * n | 0) / n;
      oldProps.alpha = props.alpha;
    }
  }
});
