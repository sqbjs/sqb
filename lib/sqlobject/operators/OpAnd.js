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
 * Expose `OpAnd`.
 */
module.exports = OpAnd;

/**
 * @param {...Operator} operator
 * @constructor
 * @public
 */
function OpAnd(operator) {
  LogicalOperator.apply(this, arguments);
}

OpAnd.prototype.operatorType = 'and';

Object.setPrototypeOf(OpAnd.prototype, LogicalOperator.prototype);
OpAnd.prototype.constructor = OpAnd;
