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
 * Expose `OpNot`.
 */
module.exports = OpNot;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpNot(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpNot.prototype.operatorType = 'not';

Object.setPrototypeOf(OpNot.prototype, CompOperator.prototype);
OpNot.prototype.constructor = OpNot;

OpNot.prototype.__serialize = function(ctx, o) {
  return o.expression + ' is not ' + o.value1;
};
