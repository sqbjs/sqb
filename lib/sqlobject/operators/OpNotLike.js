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
const OpLike = require('./OpLike');

/**
 *
 * @class
 */
class OpNotLike extends OpLike {

  /**
   * @param {String|Serializable} expression
   * @param {*} value
   * @constructor
   * @public
   */
  constructor(expression, value) {
    super(expression, value);
    this._operatorType = 'notLike';
    this._symbol = 'not like';
  }

}

/**
 * Expose `OpNotLike`.
 */
module.exports = OpNotLike;
