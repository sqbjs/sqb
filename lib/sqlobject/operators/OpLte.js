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
class OpLte extends CompOperator {

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
    return 'lte';
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
    return o.expression + ' <= ' + o.value1;
  }

}

/**
 * Expose `OpLte`.
 */
module.exports = OpLte;
