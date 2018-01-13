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
 * Expose `OpGt`.
 */
module.exports = OpGt;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpGt(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpGt.prototype.operatorType = 'gt';

Object.setPrototypeOf(OpGt.prototype, CompOperator.prototype);
OpGt.prototype.constructor = OpGt;

OpGt.prototype.__serialize = function(ctx, o) {
  return o.expression + ' > ' + o.value1;
};
