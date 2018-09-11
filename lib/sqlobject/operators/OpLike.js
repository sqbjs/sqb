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
const Serializable = require('../../Serializable');

/**
 *
 * @class
 */
class OpLike extends CompOperator {

  /**
   * @param {String|Serializable} expression
   * @param {*} value
   * @constructor
   * @public
   */
  constructor(expression, value) {
    super(expression, value);
    this._operatorType = 'like';
    this._symbol = 'like';
  }

  /**
   *
   * @param {Object} ctx
   * @param {Object} o
   * @protected
   */
  _beforeSerialize(ctx, o) {
    if (typeof o.value !== 'string')
      o.value = o.value == null ? null :
          Serializable.serializeObject(ctx, String(o.value));
  }

}

/**
 * Expose `OpLike`.
 */
module.exports = OpLike;
