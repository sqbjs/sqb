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
    this.isOperator = true;
  }

}

/**
 * Expose `Operator`.
 */
module.exports = Operator;
