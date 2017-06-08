/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * @interface
 * @public
 */

class ResultCache {

  constructor(config) {
  }

  get(index, callback) {
  }

  set(index, row) {
  }

}

/**
 * @class
 * @public
 */
class SimpleResultCache extends ResultCache {

  constructor(config) {
    super(config);
    this._rows = {};
  }

  get(rowNum, callback) {
    callback(undefined, this._rows[rowNum]);
  }

  set(rowNum, row) {
    this._rows[rowNum] = row;
  }

}

module.exports = {
  ResultCache,
  SimpleResultCache
};
