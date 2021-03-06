/**!
 *
 * Copyright (c) 2015 Cisco Systems, Inc. See LICENSE file.
 * @private
 */

/* eslint-env browser */

import {NotFoundError} from '@ciscospark/spark-core';

const namespaces = new WeakMap();
const loggers = new WeakMap();

/**
 * localStorage adapter for spark-core storage layer
 */
export default class StorageAdapterLocalStorage {
  /**
   * @constructs {StorageAdapterLocalStorage}
   * @param {string} basekey localStorage key underwhich all namespaces will be
   * stored
   */
  constructor(basekey) {
    /**
     * localStorage binding
     */
    this.Bound = class {
      /**
       * @constructs {Bound}
       * @param {string} namespace
       * @param {Object} options
       */
      constructor(namespace, options) {
        namespaces.set(this, namespace);
        loggers.set(this, options.logger);
      }

      /**
       * @private
       * @returns {mixed}
       */
      _load() {
        const rawData = localStorage.getItem(basekey);
        const allData = rawData ? JSON.parse(rawData) : {};
        return allData[namespaces.get(this)] || {};
      }

      /**
       * @param {Object} data
       * @private
       * @returns {undefined}
       */
      _save(data) {
        const rawData = localStorage.getItem(basekey);
        const allData = rawData ? JSON.parse(rawData) : {};
        allData[namespaces.get(this)] = data;

        localStorage.setItem(basekey, JSON.stringify(allData));
      }

      /**
       * Removes the specified key
       * @param {string} key
       * @returns {Promise}
       */
      del(key) {
        return new Promise((resolve) => {
          loggers.get(this).info(`local-storage-store-adapter: deleting \`${key}\``);
          const data = this._load();
          Reflect.deleteProperty(data, key);
          this._save(data);
          resolve();
        });
      }

      /**
       * Retrieves the data at the specified key
       * @param {string} key
       * @returns {Promise<mixed>}
       */
      get(key) {
        return new Promise((resolve, reject) => {
          loggers.get(this).info(`local-storage-store-adapter: reading \`${key}\``);
          const data = this._load();
          const value = data[key];
          if (value) {
            return resolve(value);
          }

          return reject(new NotFoundError(`No value found for ${key}`));
        });
      }

      /**
       * Stores the specified value at the specified key
       * @param {string} key
       * @param {mixed} value
       * @returns {Promise}
       */
      put(key, value) {
        return new Promise((resolve) => {
          loggers.get(this).info(`local-storage-store-adapter: writing \`${key}\``);
          const data = this._load();
          data[key] = value;
          this._save(data);
          resolve();
        });
      }
    };
  }

  /**
   * Returns an adapter bound to the specified namespace
   * @param {string} namespace
   * @param {Object} options
   * @returns {Promise<Bound>}
   */
  bind(namespace, options) {
    options = options || {};
    if (!namespace) {
      return Promise.reject(new Error(`\`namespace\` is required`));
    }

    if (!options.logger) {
      return Promise.reject(new Error(`\`options.logger\` is required`));
    }

    options.logger.info(`local-storage-store-adapter: returning binding`);

    return Promise.resolve(new this.Bound(namespace, options));
  }
}
