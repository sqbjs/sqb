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
 * Expose `OpNotLike`.
 */
module.exports = OpNotLike;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpNotLike(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpNotLike.prototype.operatorType = 'notLike';

Object.setPrototypeOf(OpNotLike.prototype, CompOperator.prototype);
OpNotLike.prototype.constructor = OpNotLike;

OpNotLike.prototype.__serialize = function(ctx, o) {
  return o.expression + ' not like ' +
      (typeof o.value1 === 'string' ? o.value1 :
          Serializable.serializeObject(ctx, String(o.value1)));
};
