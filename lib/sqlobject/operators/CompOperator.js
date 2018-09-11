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
   * @param {*} value...
   * @constructor
   * @public
   */
  constructor(expression, ...value) {
    super();
    this._expression = expression;
    this._values = value;
    this._symbol = '';
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

    const expression = this._expression.isSerializable ?
        this._expression._serialize(ctx) : String(this._expression);
    const o = {
      operatorType: this.operatorType,
      expression: this._expression.isQuery ?
          '(' + expression + ')' : expression,
      symbol: this._symbol
    };

    if (this._values.length > 1) {
      o.value1 = Serializable.serializeObject(ctx, this._values[0]);
      o.value2 = Serializable.serializeObject(ctx, this._values[1]);
    } else
      o.value = Serializable.serializeObject(ctx, this._values[0]);

    this._beforeSerialize(ctx, o);

    return Serializable.serializeFallback(ctx, 'comparison', o, (_ctx, _o) => {
      return this.__serialize(_ctx || ctx, _o || o);
    });
  }

  /**
   *
   * @param {Object} ctx
   * @param {Object} o
   * @protected
   */
  _beforeSerialize(ctx, o) {
    // Do nothing
  }

  /**
   * @param {Object} ctx
   * @param {Object} o
   * @protected
   * @return {String}
   */
  __serialize /* istanbul ignore next : This is an abstract method */(ctx, o) {
    return o.expression + ' ' + o.symbol + ' ' + o.value;
  }

}

/**
 * Expose `CompOperator`.
 */
module.exports = CompOperator;
