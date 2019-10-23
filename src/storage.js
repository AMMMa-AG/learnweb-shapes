/*
 * $Id: storage.js 44365 2018-03-06 12:06:57Z robertj $
 */

import store from 'store';
import defaultTo from 'lodash/defaultTo';
import forOwn from 'lodash/forOwn';

export default class Storage {
  /**
   * Creates a storage for the specified namespace.
   *
   * @param {string} nameSpace
   */
  constructor(nameSpace) {
    this.nameSpace = nameSpace + ".";
  }

  get prefix() {
    return window.location.pathname + this.nameSpace;
  }

  /**
   * Loads the value stored under the specified @key.
   *
   * @param {string} key
   * @param {*} [defaultValue]
   */
  load(key, defaultValue = undefined) {
    return defaultTo(store.get(this.prefix + key), defaultValue);
  }

  /**
   * Stores a value under the specified key.
   *
   * @param {string} key
   * @param {*} value
   */
  store(key, value) {
    store.set(this.prefix + key, value);
  }

  /**
   * Clears the value stored under the specified @keyOrPrefix, or
   * all values stored under this namespace, when no key
   * was specified.
   *
   * @param {string} [keyOrPrefix]
   */
  clear(keyOrPrefix) {
    const name = this.prefix + keyOrPrefix;
    store.each((v, k) => {
      if (k.startsWith(name)) {
        store.remove(k);
      }
    });
  }

  /**
   * Gets all key/value pairs stored under the given @keyOrPrefix.
   *
   * @param {string} keyOrPrefix
   * @returns {Object}
   */
  getMap(keyOrPrefix) {
    const name = this.prefix + keyOrPrefix;
    const res = {};
    store.each((v, k) => {
      if (k.startsWith(name)) {
        res[k.substring(name.length)] = v;
      }
    });
    return res;
  }

  /**
   * Exports the storage as a plain object.
   *
   * @returns {Object}
   */
  exportStorage() {
    const name = this.prefix;
    const res = {};
    store.each((value, key) => {
      if (key.startsWith(name)) {
        res[key] = value;
      }
    });
    return res;
  }

  /**
   * Imports the specified bag (Object) into the current storage.
   *
   * @param {Object} bag
   */
  importStorage(bag) {
    this.clear('');
    this.mergeStorage(bag);
  }

  /**
   * Merges the specified bag (Object) with the current storage.
   *
   * @param {Object} bag
   */
  mergeStorage(bag) {
    forOwn(bag, (value, key) => {
      store.set(key, value);
    });
  }

  /**
   * Clears *all* storage keys.
   */
  static clearAll() {
    store.clearAll();
  }

  /**
   * Exports all keys stored by all Storage instances under an optional prefix.
   *
   * @param {string} [prefix = ''] optional prefix.
   */
  static exportAll(prefix = '') {
    const path = window.location.pathname + prefix;
    let bag = {};
    store.each((value, key) => {
      if (key.startsWith(path)) {
        bag[key] = value;
      }
    });
    return bag;
  }

  /**
   * Imports all keys from the specified object into all Storage instances.
   *
   * @param {Object} bag
   */
  static importAll(bag) {
    forOwn(bag, (value, key) => {
      store.set(key, value);
    });
  }
}
