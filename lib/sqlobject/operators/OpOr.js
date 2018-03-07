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
const LogicalOperator = require('./LogicalOperator');

/**
 * Expose `OpOr`.
 */
module.exports = OpOr;

/**
 * @param {...Operator} operator
 * @constructor
 * @public
 */
function OpOr(operator) {
  LogicalOperator.apply(this, arguments);
}

OpOr.prototype.operatorType = 'or';

Object.setPrototypeOf(OpOr.prototype, LogicalOperator.prototype);
OpOr.prototype.constructor = OpOr;
