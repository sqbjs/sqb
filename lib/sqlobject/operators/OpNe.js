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
 * Expose `OpNe`.
 */
module.exports = OpNe;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpNe(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpNe.prototype.operatorType = 'ne';

Object.setPrototypeOf(OpNe.prototype, CompOperator.prototype);
OpNe.prototype.constructor = OpNe;

OpNe.prototype.__serialize = function(ctx, o) {
  return o.expression + ' not = ' + o.value1;
};
