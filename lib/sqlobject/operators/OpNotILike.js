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
 * Expose `OpNotILike`.
 */
module.exports = OpNotILike;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpNotILike(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpNotILike.prototype.operatorType = 'notILike';

Object.setPrototypeOf(OpNotILike.prototype, CompOperator.prototype);
OpNotILike.prototype.constructor = OpNotILike;

OpNotILike.prototype.__serialize = function(ctx, o) {
  return o.expression + ' not ilike ' +
      (typeof o.value1 === 'string' ? o.value1 :
          Serializable.serializeObject(ctx, String(o.value1)));
};
