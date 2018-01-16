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
const Operator = require('../Operator');
const Serializable = require('../../Serializable');

/**
 * Expose `CompOperator`.
 */
module.exports = CompOperator;

/**
 * @param {String|Serializable} expression
 * @param {*} value1
 * @param {*} value2
 * @constructor
 * @public
 */
function CompOperator(expression, value1, value2) {
  Operator.call(this);
  this._expression = expression;
  this._value1 = value1;
  this._value2 = value2;
}

Object.setPrototypeOf(CompOperator.prototype, Operator.prototype);
CompOperator.prototype.constructor = CompOperator;

CompOperator.prototype._serialize = function(ctx) {

  const serializeValue = function(val) {
    return Serializable.serializeObject(ctx, val);
  };
  const o = {
    expression:
        this._expression.isSerializable ?
            (this._expression.isQuery ?
                '(' + this._expression._serialize(ctx) + ')' :
                this._expression._serialize(ctx)) :
            String(this._expression),
    value1: serializeValue(this._value1),
    value2: this._value2 ? serializeValue(this._value2) : null
  };
  const self = this;
  return Serializable.serializeFallback(ctx, 'operator_' +
      self.operatorType, o, function() {
    return self.__serialize(ctx, o);
  });
};

/**
 * @abstract
 * @return {String}
 */
/* istanbul ignore next : This is an abstract method */
CompOperator.prototype.__serialize = function() {
  return '';
};
