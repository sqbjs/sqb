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
 * Expose `OpBetween`.
 */
module.exports = OpBetween;

/**
 * @param {String|Serializable} expression
 * @param {*} val1
 * @param {*} val2
 * @constructor
 * @public
 */
function OpBetween(expression, val1, val2) {
  if (Array.isArray(val1)) {
    val2 = val1[1];
    val1 = val1[0];
  }
  CompOperator.apply(this, [expression, val1, val2 || val1]);
}

OpBetween.prototype.operatorType = 'between';

Object.setPrototypeOf(OpBetween.prototype, CompOperator.prototype);
OpBetween.prototype.constructor = OpBetween;

OpBetween.prototype.__serialize = function(ctx, o) {
  return o.expression + ' between ' + o.value1 + ' and ' + o.value2;
};
