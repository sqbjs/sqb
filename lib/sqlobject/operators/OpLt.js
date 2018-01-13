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
 * Expose `OpLt`.
 */
module.exports = OpLt;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpLt(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpLt.prototype.operatorType = 'lt';

Object.setPrototypeOf(OpLt.prototype, CompOperator.prototype);
OpLt.prototype.constructor = OpLt;

OpLt.prototype.__serialize = function(ctx, o) {
  return o.expression + ' < ' + o.value1;
};
