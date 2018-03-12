/* eslint-disable */
/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const Operator = require('../Operator');
const Serializable = require('../../Serializable');

/**
 *
 * @class
 * @abstract
 */
class CompOperator extends Operator {

  /**
   * @param {String|Serializable} expression
   * @param {*} value1
   * @param {*} [value2]
   * @constructor
   * @public
   */
  constructor(expression, value1, value2) {
    super();
    this._expression = expression;
    this._value1 = value1;
    this._value2 = value2;
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    ctx.operatorType = this.operatorType;

    const serializeValue = (val) => {
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

    return Serializable.serializeFallback(ctx, 'operator', o, () => {
      return this.__serialize(ctx, o);
    });
  }

  /**
   * @abstract
   * @return {String}
   */
  __serialize /* istanbul ignore next : This is an abstract method */ () {
    return '';
  }

}

/**
 * Expose `CompOperator`.
 */
module.exports = CompOperator;
