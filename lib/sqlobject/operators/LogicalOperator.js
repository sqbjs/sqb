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
const ArgumentError = require('errorex').ArgumentError;
const Operator = require('../Operator');
const Serializable = require('../../Serializable');
const isPlainObject = require('putil-isplainobject');

/**
 *
 * @class
 * @abstract
 */
class LogicalOperator extends Operator {

  /**
   * @param {...Operator} operator
   * @constructor
   * @public
   */
  constructor(...operator) {
    super();
    this._items = [];
    this.add(...operator);
  }

  /**
   * Returns operator type
   * @public
   * @return {string}
   */
  get operatorType() {
    return '';
  }

  /**
   * Adds operator(s) to item list
   *
   * @param {...Operator} operator
   * @public
   */
  add(...operator) {
    for (const arg of arguments) {
      if (!arg) continue;
      if (isPlainObject(arg)) {
        this.add(...this._wrapObject(arg));
        continue;
      }
      if (!(arg.isOperator || arg.isRaw))
        throw new ArgumentError('Operator or Raw type required');
      this._items.push(arg);
    }
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {String}
   * @override
   */
  _serialize(ctx) {
    const arr = [];
    for (const t of this._items) {
      const s = t._serialize(ctx);
      /* istanbul ignore else */
      if (s)
        arr.push((t.operatorType === 'and' || t.operatorType === 'or') ?
            '(' + s + ')' : s);
    }
    return Serializable.serializeFallback(ctx, 'operator', arr, () => {
      const s = Serializable.joinArray(arr, ' ' + this.operatorType);
      return (s.indexOf('\n') > 0) ? s.replace('\n', '\n\t') + '\b' : s;
    });
  }

  /**
   *
   * @param {Object} obj
   * @return {Array}
   * @private
   */
  _wrapObject(obj) {
    const Op = require('../../sqb_ns').Op;
    const result = [];
    for (const n of Object.getOwnPropertyNames(obj)) {
      let op;
      const v = obj[n];
      if (n === 'and' || n === 'or') {
        op = Op[n];
        result.push(Array.isArray(v) ? op.apply(null, v) : op(v));
        continue;
      }
      const m = n.match(/^([\w\\.$]+) *(.*)$/);
      if (!m)
        throw new ArgumentError('"%s" is not a valid definition', n);
      op = Op[m[2] || 'eq'];
      if (!op)
        throw new ArgumentError('Unknown operator "%s"', m[2]);
      result.push(op(m[1], obj[n]));
    }
    return result;
  }
}

/**
 * Expose `LogicalOperator`.
 */
module.exports = LogicalOperator;


