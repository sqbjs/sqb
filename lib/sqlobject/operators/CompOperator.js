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
   *
   * @return {String|Serializable}
   */
  get expression() {
    return this._expression;
  }

  /**
   *
   * @param {String|Serializable} x
   */
  set expression(x) {
    this._expression = x;
  }

  /**
   *
   * @return {Array<*>}
   */
  get values() {
    return this._values;
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

    const expression = this.expression.isSerializable ?
        this.expression._serialize(ctx) : this.expression;
    const o = {
      operatorType: this.operatorType,
      expression: this.expression.isQuery ?
          '(' + expression + ')' : expression,
      symbol: this._symbol
    };

    if (this.values.length > 1) {
      o.value1 = Serializable.serializeObject(ctx, this.values[0]);
      o.value2 = Serializable.serializeObject(ctx, this.values[1]);
    } else
      o.value = Serializable.serializeObject(ctx, this.values[0]);

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
    if (o.value === '()')
      return '';
    return (Array.isArray(o.expression) ?
        '(' + o.expression.join(',') + ')' : o.expression) +
        ' ' + o.symbol + ' ' + o.value;
  }

}

/**
 * Expose `CompOperator`.
 */
module.exports = CompOperator;
