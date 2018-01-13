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
 * Expose `OpIs`.
 */
module.exports = OpIs;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpIs(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpIs.prototype.operatorType = 'is';

Object.setPrototypeOf(OpIs.prototype, CompOperator.prototype);
OpIs.prototype.constructor = OpIs;

OpIs.prototype.__serialize = function(ctx, o) {
  return o.expression + ' is ' + o.value1;
};
