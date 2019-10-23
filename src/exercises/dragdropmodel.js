/*
 * $Id: dragdropmodel.js 43564 2017-10-27 16:37:43Z robertj $
 */

import { createjs } from 'EaselJS';
import intersection from 'lodash/intersection';
import defaultTo from 'lodash/defaultTo';

export default class DragDropModel {
  /**
   * Creates a DragDropModel from the specified object.
   * TODO: document @model.
   *
   * @param {Object} model
   */
  constructor(model) {
    this.sources = model.sources;
    this.targets = model.targets;
    this.expect = model.expect;
    this.conditions = model.conditions || "all";

    // check whether we got an "identity" and resolve it by
    // setting expect[i] = i for each i.
    if (this.expect === 'identity') {
      this.expect = {};
      for (let i = 0; i < this.targets; i++) {
        this.expect[i] = [i];
      }
    }

    // normalize "expect": { "0" : "1"} to "expect": { "0" : ["1"]}
    for (let i = 0; i < this.targets; i++) {
      if (this.expect.hasOwnProperty(i)) {
        let sources = this.expect[i];
        if (Array.isArray(sources)) {
          sources.sort();
        } else {
          this.expect[i] = [sources];
        }
      }
    }

    let condition = 'all';
    if (typeof(this.conditions) === 'string') {
      condition = this.conditions;
      this.conditions = {};
    }

    // initialize conditions
    for (let i = 0; i < this.targets; i++) {
      if (!this.conditions.hasOwnProperty(i)) {
        this.conditions[i] = condition;
      } else {
        let condition = this.conditions[i];
        if (!(condition === 'all' || condition === 'any'))
          this.conditions[i] = condition;
      }
    }

    this.init();
  }

  /**
   * Initialises the results.
   * @private
   */
  init() {
    // clone "expect" as "result" and clear the results.
    this.result = JSON.parse(JSON.stringify(this.expect));
    this.lengths = {};
    Object.keys(this.result).forEach(key => {
      let list = this.result[key];
      this.result[key] = [];
      this.lengths[key] = list.length;
    });
    this.targetBySource = new Map();
    this.sourcesByTarget = new Map();
  }

  /**
   * Raises a custom event.
   * @private
   *
   * @param {string} type
   * @param {number} source
   * @param {number} target
   */
  raiseEvent(type, source = -1, target = -1) {
    let event = new createjs.Event(type);
    event.args = { source, target };
    this.dispatchEvent(event);
  }

  /**
   * Drops source on target.
   *
   * @param {number} source
   * @param {number} target
   * @fires drop
   * @fires overflow
   * @returns {Boolean}
   */
  drop(source, target) {
    let oldTarget = this.targetOf(source);
    if (oldTarget == target)
      return false;

    // undrop from old target
    if (oldTarget >= 0)
      this.undrop(source, oldTarget);

    let list = this.result[target] || [];
    list.push(source);
    list.sort();
    this.targetBySource.set(source, target);
    this.sourcesByTarget.set(target, list);
    this.result[target] = list;

    this.raiseEvent("drop", source, target);
    return true;
  }

  /**
   * Undrops source from target.
   *
   * @param {number} source
   * @param {number} target
   * @fires undrop
   * @returns {Boolean}
   */
  undrop(source, target) {
    let res = false;
    if (this.result.hasOwnProperty(target)) {
      let list = this.result[target];
      if (list.includes(source)) {
        list = list.filter(item => item != source);
        this.result[target] = list;
        this.targetBySource.delete(source);
        this.sourcesByTarget.set(target, list);
        res = true;
      }
    }
    if (res)
      this.raiseEvent("undrop", source, target);
    return res;
  }

  /**
   * Undrops source from all targets.
   * @param {number} source
   */
  undropSource(source) {
    Object.keys(this.result).forEach(target => {
      let list = this.result[target];
      if (list.includes(source)) {
        this.undrop(source, parseInt(target));
      }
    });
  }

  /**
   * Whether source can be dropped on target.
   *
   * @param {number} source
   * @param {number} target
   */
  canDrop(source, target) {
    let sources = this.sourcesOf(target);
    return !sources.includes(source) && sources.length < this.maxSourcesOf(target);
  }

  /**
   * Checks whether the results are correct.
   *
   * @returns {Boolean}
   */
  check() {
    for (let i = 0; i < this.targets; i++) {
      if (!this.checkTarget(i))
        return false;
    }
    return true;
  }

  /**
   * Checks whether all target's sources are correct.
   *
   * @param {number} target
   * @returns {Boolean}
   */
  checkTarget(target) {
    let currentSources = this.sourcesOf(target);
    let expectedSources = this.expect[target] || [];
    let condition = this.conditions[target];

    if (condition == 'all') {
      let i = intersection(currentSources, expectedSources);
      return i.length == expectedSources.length && expectedSources.length == currentSources.length;
    } else if (condition == 'any') {
      let i = intersection(currentSources, expectedSources);
      return i.length == 1 && currentSources.length == 1;
    }
  }

  /**
   * Checks whether the source was dropped on the correct target.
   *
   * @param {number} source
   * @returns {Boolean}
   */
  checkSource(source) {
    let target = this.targetOf(source);
    if (target < 0)
      return false;

    let expectedSources = this.expect[target] || [];
    let condition = this.conditions[target];

    if (condition == 'all')
      return expectedSources.includes(source);
    else if (condition == 'any') {
      return this.checkTarget(target);
    }
  }

  /**
   * Clears the results so we can start over again.
   * @fires clear
   */
  clear() {
    this.init();
    this.raiseEvent("clear");
  }

  /**
   * Sets the results. @result must match the structure of this.result.
   *
   * @param {Object} result
   * @fires set
   */
  set(result) {
    if (!result) return;

    this.result = result;
    // initialize source-target maps
    Object.keys(this.result).forEach(target => {
      let sources = this.result[target];
      this.sourcesByTarget.set(target, sources);
      sources.forEach(source => {
        this.targetBySource.set(source, target);
      })
    });
    this.raiseEvent("set");
  }

  /**
   * Returns the target of the specified source or -1.
   *
   * @param {number} source
   * @returns {number}
   */
  targetOf(source) {
    return defaultTo(this.targetBySource.get(source), -1);
  }

  /**
   * Returns the sources of the specified target.
   * @param {number} target
   * @returns {number[]}
   */
  sourcesOf(target) {
    return this.sourcesByTarget.get(target) || [];
  }

  /**
   * Return the max amount of sources that can be dropped on target.
   *
   * @param {number} target
   * @returns {number}
   */
  maxSourcesOf(target) {
    let condition = this.conditions[target];

    if (condition == 'all')
      return this.lengths[target];
    else if (condition == 'any')
      return Math.min(1, this.lengths[target]);
  }

  /**
   * Returns which sources are expected on the specified target.
   *
   * @param {number} target
   * @returns {Array}
   */
  expects(target) {
    return this.expect[target] || [];
  }

  /**
   * Returns a human-suitable representation of which sources are
   * expected on the specified target.
   *
   * @param {number} target
   * @returns {String}
   */
  expectsToString(target) {
    let list = this.expects(target);
    let cond = this.conditions[target];
    let operator = cond == 'all' ? ' AND ' : (cond == 'any' ? ' OR ' : ', ');
    return list.join(operator);
  }
}

// add EventDispatcher capabilities
createjs.EventDispatcher.initialize(DragDropModel.prototype);
