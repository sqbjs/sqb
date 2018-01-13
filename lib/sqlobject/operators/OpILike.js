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
 * Expose `OpILike`.
 */
module.exports = OpILike;

/**
 * @param {String|Serializable} expression
 * @param {*} value
 * @constructor
 * @public
 */
function OpILike(expression, value) {
  CompOperator.apply(this, [expression, value]);
}

OpILike.prototype.operatorType = 'ilike';

Object.setPrototypeOf(OpILike.prototype, CompOperator.prototype);
OpILike.prototype.constructor = OpILike;

OpILike.prototype.__serialize = function(ctx, o) {
  return o.expression + ' ilike ' +
      (typeof o.value1 === 'string' ? o.value1 :
          '\'' + o.value1 + '\'');
};
