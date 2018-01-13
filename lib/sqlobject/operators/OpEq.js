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
 * Expose `OpEq`.
 */
module.exports = OpEq;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpEq(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpEq.prototype.operatorType = 'eq';

Object.setPrototypeOf(OpEq.prototype, CompOperator.prototype);
OpEq.prototype.constructor = OpEq;

OpEq.prototype.__serialize = function(ctx, o) {
  return o.expression + ' = ' + o.value1;
};
