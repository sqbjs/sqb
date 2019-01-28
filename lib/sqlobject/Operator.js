/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const Serializable = require('../Serializable');

/**
 * @class
 * @abstract
 */
class Operator extends Serializable {

  /**
   * @constructor
   * @public
   */
  constructor() {
    super();
    this._operatorType = null;
  }

  /**
   * Returns operator type
   *
   * @public
   * @return {string}
   */
  get operatorType() {
    return this._operatorType;
  }
}

/**
 * Expose `Operator`.
 */
module.exports = Operator;
