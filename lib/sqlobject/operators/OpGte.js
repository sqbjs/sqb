/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Module dependencies.
 * @private
 */
const CompOperator = require('./CompOperator');

/**
 * Expose `OpGte`.
 */
module.exports = OpGte;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpGte(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpGte.prototype.operatorType = 'gte';

Object.setPrototypeOf(OpGte.prototype, CompOperator.prototype);
OpGte.prototype.constructor = OpGte;

OpGte.prototype.__serialize = function(ctx, o) {
  return o.expression + ' >= ' + o.value1;
};
