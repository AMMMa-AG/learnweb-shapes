/*
 * $Id: array.js 42446 2017-07-30 22:08:44Z robertj $
 *
 * Array extensions.
 */

Object.assign(Array.prototype, {
  /**
   * Returns the min value of the (optionally mapped) array values.
   * @param {function(any): any} mapper: options mapper. See Array.map().
   */
  min(mapper) {
    const array = mapper ? this.map(mapper) : this;
    return array.reduce((a, b) => Math.min(a, b));
  },

  /**
   * Returns the max value of the (optionally mapped) array values.
   * @param {function(any): any} mapper: options mapper. See Array.map().
   */
  max(mapper) {
    const array = mapper ? this.map(mapper) : this;
    return array.reduce((a, b) => Math.max(a, b));
  }
});
