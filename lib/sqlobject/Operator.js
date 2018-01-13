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
const Serializable = require('../Serializable');

/**
 * Expose `Operator`.
 */
module.exports = Operator;

/**
 * @constructor
 * @public
 */
function Operator() {
  Serializable.call(this);
}

Operator.prototype = {
  get isOperator() {
    return true;
  }
};
Object.setPrototypeOf(Operator.prototype, Serializable.prototype);
Operator.prototype.constructor = Operator;
