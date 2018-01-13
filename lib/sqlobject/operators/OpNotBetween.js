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
const Serializable = require('../../Serializable');

/**
 * Expose `OpNotBetween`.
 */
module.exports = OpNotBetween;

/**
 * @param {String|Serializable} expression
 * @param {*} val1
 * @param {*} val2
 * @constructor
 * @public
 */
function OpNotBetween(expression, val1, val2) {
  CompOperator.apply(this, [expression, val1, val2 || val1]);
}

OpNotBetween.prototype.operatorType = 'notBetween';

Object.setPrototypeOf(OpNotBetween.prototype, CompOperator.prototype);
OpNotBetween.prototype.constructor = OpNotBetween;

OpNotBetween.prototype.__serialize = function(ctx, o) {
  return o.expression + ' not between ' + o.value1 + ' and ' + o.value2;
};
