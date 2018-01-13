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
 * Expose `OpNotIn`.
 */
module.exports = OpNotIn;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpNotIn(expression, value) {
  CompOperator.apply(this, [expression,
    Array.isArray(value) || value instanceof RegExp ? value : [value]]);
}

OpNotIn.prototype.operatorType = 'notIn';

Object.setPrototypeOf(OpNotIn.prototype, CompOperator.prototype);
OpNotIn.prototype.constructor = OpNotIn;

OpNotIn.prototype.__serialize = function(ctx, o) {
  return o.expression + ' not in ' + o.value1;
};
