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
class OpBetween extends CompOperator {

  /**
   * @param {String|Serializable} expression
   * @param {*} val1
   * @param {*} val2
   * @constructor
   * @public
   */
  constructor(expression, val1, val2) {
    if (Array.isArray(val1)) {
      val2 = val1[1];
      val1 = val1[0];
    }
    super(expression, val1, val2 || val1);
    this._operatorType = 'between';
    this._symbol = 'between';
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @param {Object} o
   * @return {string}
   * @override
   */
  __serialize(ctx, o) {
    return o.expression + ' ' + o.symbol + ' ' + o.value1 + ' and ' + o.value2;
  }

}

/**
 * Expose `OpBetween`.
 */
module.exports = OpBetween;
