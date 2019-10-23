/*
 * $Id: utils.js 46694 2018-10-17 15:18:29Z anna $
 */

import shuffle from 'lodash/shuffle';

export default class Utils {
  /**
   * Converts the specified number to a fully padded (with leading zeros)
   * hex string.
   *
   * @param {number} value: number to convert
   * @returns {string}
   */
  static toHex(value) {
    return ("0" + (Number(value).toString(16))).slice(-2).toUpperCase();
  }

  /**
   * Converts the specified r, g, b numbers to a HTML color string.
   *
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {string}
   */
  static toHtmlColor(r, g, b) {
    return "#" + this.toHex(r) + this.toHex(g) + this.toHex(b);
  }

  /**
   * Converts the specified Hex to rgba
   *
   * @param {string} hex
   * @returns {string}
   */
  static hexToRGB(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
  }


  /**
   * Delays the execution of the specified function.
   * Returns a Promise which resolves after the function was executed, and
   * rejects when an exception ocurred.
   *
   * @param {number} msec: The amount of milliseconds to delay.
   * @param {function(...any): any} func: The function to be deferred.
   * @returns {Promise}
   */
  static delay(msec, func, ...args) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(func(...args));
      }, msec);
    });
  }

  /**
   * Defers the execution of the specified function.
   * Returns a Promise which resolves after the function was executed, and
   * rejects when an exception ocurred.
   *
   * @param {function(...any): any} func: The function to be deferred.
   * @returns {Promise}
   */
  static defer(func, ...args) {
    return this.delay(1, func, ...args);
  }

  /**
   * Returns the hh:mm:ss string representation of the
   * specified amount of seconds.
   *
   * @param {number} seconds
   * @param {boolean} [round = true]: whether to round the seconds.
   */
  static toHHMMSS(seconds, round = true) {
    let h = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    let m = Math.floor(seconds / 60);
    seconds = seconds % 60;
    let s = round ? Math.floor(seconds) : seconds.toFixed(2);

    let res = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    if (h)
      res = (h < 10 ? "0" + h : h) + ":" + res;

    return res;
  }

  /**
   * Returns a "deferrer", a decomposed Promise which can be used
   * to reject & resolve outside of a Promise ctor.
   *
   * @returns {{promise, resolve, reject}}
   *
   * @example
   *
   * let defer = Utils.getDeferrer();
   * defer.resolve();  // -> resolve defer.promise
   * defer.reject();   // -> reject  defer.promise
   *
   * versus:
   *
   * let p = new Promise((resolve, reject) => {
   *   resolve();
   * });
   */
  static getDeferrer() {
    let resolve, reject;
    let promise = new Promise((resolveArg, rejectArg) => {
      resolve = resolveArg;
      reject = rejectArg;
    });
    return {
      promise,
      resolve,
      reject
    };
  }

  /**
   * Returns an (end - start + 1) array consisting of substituted patterns.
   *
   * @param {string} pattern: the pattern containing a "%d" which will be substituted.
   * @param {number} start: a start index.
   * @param {number} end: an end index.
   *
   * @returns {Array}
   *
   * @example
   *
   * array = Utils.explode("test%d.png", 1, 5);
   *  =>
   * array[0] == "test1.png"
   * ...
   * array[4] == "test5.png"
   */
  static explode(pattern, start, end) {
    let res = [];
    for (let i = start; i <= end; i++)
      res.push(pattern.replace("%d", i.toString()));
    return res;
  }

  /**
   * Checks whether 2 objects are deeply equal.
   *
   * @param {Object} a
   * @param {Object} b
   */
  static deepEquals(a, b) {
    const keys = Object.keys;
    const ta = typeof a;
    const tb = typeof b;

    return a && b && ta === 'object' && ta === tb ? (
      keys(a).length === keys(b).length &&
      keys(a).every(key => this.deepEquals(a[key], b[key]))
    ) : (a === b);
  }

  /**
   * Creates an identity array (a[i] = i) of the specified @length.
   * @param {number} length
   */
  static getIdentityArray(length) {
    let array = new Array(length);
    for (let i = 0; i < length; i++) array[i] = i;
    return array;
  }

  /**
   * Creates a permutation of an identity array of the specified @length.
   *
   * @param {number} length
   * @returns {number[]}
   */
  static getPermutation(length) {
    return shuffle(this.getIdentityArray(length));
  }

  /**
   * Like array.forEach() but in the order given by the specified
   * identity permutation.
   *
   * @param {Array} array: source array.
   * @param {Array} permutation: as obtained from Utils.getPermutation().
   * @param {function(any, number, number)} callback
   */
  static permutedForEach(array, permutation, callback) {
    array.forEach((value, index) => {
      let pindex = permutation[index];
      let pvalue = array[pindex];
      callback(pvalue, pindex, index);
    });
  }

  /**
   * Clones the specified object.
   *
   * @param {any} obj
   * @returns {any}
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}
