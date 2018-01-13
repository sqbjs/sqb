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
 * Expose `OpLte`.
 */
module.exports = OpLte;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpLte(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpLte.prototype.operatorType = 'lte';

Object.setPrototypeOf(OpLte.prototype, CompOperator.prototype);
OpLte.prototype.constructor = OpLte;

OpLte.prototype.__serialize = function(ctx, o) {
  return o.expression + ' <= ' + o.value1;
};
