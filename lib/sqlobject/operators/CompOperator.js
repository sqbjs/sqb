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
  const self = this;
  ctx.operatorType = self.operatorType;

  const serializeValue = function(val) {
    return Serializable.serializeObject(ctx, val);
  };
  const o = {
    operatorType: this.operatorType,
    expression: this._expression.isSerializable ?
        (this._expression.isQuery ?
            '(' + this._expression._serialize(ctx) + ')' :
            this._expression._serialize(ctx)) :
        String(this._expression)
  };
  ctx.operatorValue1 = this._value1;
  o.value1 = serializeValue(ctx.operatorValue1);
  ctx.prmValue1 = ctx.prmValue;
  delete ctx.prmValue;
  ctx.operatorValue2 = this._value2 ? serializeValue(this._value2) : null;
  o.value2 = ctx.operatorValue2;
  ctx.prmValue2 = ctx.prmValue;
  delete ctx.prmValue;

  return Serializable.serializeFallback(ctx, 'operator', o, function() {
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

