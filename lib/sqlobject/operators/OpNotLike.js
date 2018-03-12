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
class OpNotLike extends CompOperator {

  /**
   * @param {String|Serializable} expression
   * @param {*} value
   * @constructor
   * @public
   */
  constructor(expression, value) {
    super(expression, value);
  }

  /**
   * Returns operator type
   *
   * @public
   * @return {string}
   */
  get operatorType() {
    return 'notLike';
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
    return o.expression + ' not like ' +
        (typeof o.value1 === 'string' ? o.value1 :
            Serializable.serializeObject(ctx, String(o.value1)));
  }

}

/**
 * Expose `OpNotLike`.
 */
module.exports = OpNotLike;
