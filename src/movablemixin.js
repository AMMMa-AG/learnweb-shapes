/*
 * $Id: movablemixin.js 45969 2018-07-24 14:08:31Z robertj $
 */

import { createjs } from 'EaselJS'; // eslint-disable-line
import { Mixin } from 'es6-mixin';
import throttle from 'lodash/throttle';

/**
 * Provides a mixin for EaselJS DisplayObjects which fires
 * "beginmove", "moving" and "endmove" events when a display
 * object is dragged.
 *
 * Events with their arguments
 *
 * "beginmove" arguments:
 *
 * x, y: scaled stage mouse position.
 * rawX, rawY: unscaled position.
 * cancel(): function that calls preventDefault() & stopPropagation() on
 *   the original mouse event.
 *
 * "moving" arguments:
 *
 * x, y: scaled stage mouse position relative (delta) to the previous "moving" event.
 * rawX, rawY: unscaled position.
 * x0, y0: the initial "beginmove" coordinates.
 * moved: whether the difference between (x0, y0) and (x, y) is != 0
 * distance: length of the move.
 * cancel(): function that calls preventDefault() & stopPropagation() on
 *   the original mouse event.
 *
 * "endmove" arguments:
 *
 * x, y: scaled stage mouse position.
 * rawX, rawY: unscaled position.
 * x0, y0: the initial "beginmove" coordinates.
 * moved: whether the difference between (x0, y0) and (x, y) is != 0
 * distance: length of the move.
 * cancel(): function that calls preventDefault() & stopPropagation() on
 *   the original mouse event.
 */
export default class MovableMixin extends Mixin  {

  /**
   * Attaches a MovableMixin to an arbitrary createjs.EventDispatcher
   * (Shape, Container, etc.) object.
   *
   * @param {createjs.EventDispatcher} target: the target object.
   * @param {number} [wait=0]: throttle interval. When != 0, "moving"
   * events are throttled to one call per interval max.
   */
  static attach(target, wait) {
    MovableMixin.mixin(target, undefined, target, wait);
  }

  /**
   * Creates the mixin.
   */
  constructor(target, wait = 0) {
    super();

    let lastX, lastY;
    let initialX, initialY;

    // returns the scale factor of the stage
    let getScaleFactor = () => {
      const stage = target.stage;
      const sx = stage ? stage.scaleX : 1;
      const sy = stage ? stage.scaleY : 1;
      return {
        sx,
        sy
      };
    };

    // wrapper for lodash.throttle() which returns
    // identity if wait == 0, i.e.
    // throttleWrapper(func, 0)  == func
    // throttleWrapper(func, 10) == throttle(func, 10);
    let throttleWrapper = (func, wait, options) => {
      return wait ? throttle(func, wait, options) : func;
    };

    target.on("mousedown", (e) => {
      const factor = getScaleFactor();
      lastX = initialX = e.stageX / factor.sx;
      lastY = initialY = e.stageY / factor.sy;
      target.dispatchEvent({
        type: "beginmove",
        x: lastX,
        y: lastY,
        rawX: e.stageX,
        rawY: e.stageY,
        cancel: () => {
          e.preventDefault()
          e.stopPropagation();
        }
      });
    });

    target.on("pressmove", throttleWrapper((e) => {
      // kill native event
      e.nativeEvent.preventDefault();
      const factor = getScaleFactor();
      let deltaX = e.stageX / factor.sx - lastX;
      let deltaY = e.stageY / factor.sy - lastY;
      lastX = e.stageX / factor.sx;
      lastY = e.stageY / factor.sy;
      target.dispatchEvent({
        type: "moving",
        x: deltaX,
        y: deltaY,
        rawX: e.stageX,
        rawY: e.stageY,
        x0: initialX,
        y0: initialY,
        distance: Math.sqrt(Math.pow(lastX - initialX, 2) + Math.pow(lastY - initialY, 2)),
        moved: lastX != initialX && lastY != initialY,
        cancel: () => {
          e.preventDefault()
          e.stopPropagation();
        }
      });
    }, wait));

    target.on("pressup", (e) => {
      const factor = getScaleFactor();
      lastX = e.stageX / factor.sx;
      lastY = e.stageY / factor.sy;
      target.dispatchEvent({
        type: "endmove",
        x: lastX,
        y: lastY,
        rawX: e.stageX,
        rawY: e.stageY,
        x0: initialX,
        y0: initialY,
        distance: Math.sqrt(Math.pow(lastX - initialX, 2) + Math.pow(lastY - initialY, 2)),
        moved: lastX != initialX && lastY != initialY,
        cancel: () => {
          e.preventDefault()
          e.stopPropagation();
        }
      });
    });
  }
}
