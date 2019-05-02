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
const {ErrorEx} = require('errorex');

/**
 *
 * @class
 */
class OpIn extends CompOperator {

  /**
   * @param {String|Serializable} expression
   * @param {*} value
   * @constructor
   * @public
   */
  constructor(expression, value) {
    super(expression, Array.isArray(value) || value instanceof RegExp ?
        value : [value]);
    this._operatorType = 'in';
    this._symbol = 'in';
  }

  /**
   * @override
   */
  __serialize(ctx, o) {
    if (o.value === '()')
      throw new ErrorEx('"in" operator does not allow empty list');
    return super.__serialize.apply(this, arguments);
  }

}

/**
 * Expose `OpIn`.
 */
module.exports = OpIn;
