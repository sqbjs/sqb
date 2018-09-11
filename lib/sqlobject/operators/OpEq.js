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
const CompOperator = require('./CompOperator');

/**
 *
 * @class
 */
class OpEq extends CompOperator {

  /**
   * @param {String|Serializable} expression
   * @param {*} value
   * @constructor
   * @public
   */
  constructor(expression, value) {
    super(expression, value);
    this._operatorType = 'eq';
    this._symbol = '=';
  }

}

/**
 * Expose `OpEq`.
 */
module.exports = OpEq;
