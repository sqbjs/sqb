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
 * Expose `OpLike`.
 */
module.exports = OpLike;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpLike(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpLike.prototype.operatorType = 'like';

Object.setPrototypeOf(OpLike.prototype, CompOperator.prototype);
OpLike.prototype.constructor = OpLike;

OpLike.prototype.__serialize = function(ctx, o) {
  return o.expression + ' like ' +
      (typeof o.value1 === 'string' ? o.value1 :
          Serializable.serializeObject(ctx, String(o.value1)));
};
