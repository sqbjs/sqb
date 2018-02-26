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
 * Expose `OpIn`.
 */
module.exports = OpIn;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpIn(expression, value) {
  CompOperator.apply(this, [expression,
    Array.isArray(value) || value instanceof RegExp ?
        value : [value]]);
}

OpIn.prototype.operatorType = 'in';

Object.setPrototypeOf(OpIn.prototype, CompOperator.prototype);
OpIn.prototype.constructor = OpIn;

OpIn.prototype.__serialize = function(ctx, o) {
  return o.expression + ' in ' + o.value1;
};
