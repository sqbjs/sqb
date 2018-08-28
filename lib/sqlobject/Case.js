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
const Serializable = require('../Serializable');
const OpAnd = require('./operators/OpAnd');

class Case extends Serializable {

  /**
   * @constructor
   * @public
   */
  constructor() {
    super();
    this.type = 'case';
    this._expressions = [];
  }

  /**
   * Defines "when" part of Case expression.
   *
   * @param {...(Object|Operator)} condition
   * @public
   * @return {Case}
   */
  when(...condition) {
    if (condition.length)
      this._condition = new OpAnd(...condition);
    else this._condition = null;
    return this;
  }

  /**
   * Defines "then" part of Case expression.
   *
   * @param {*} value
   * @public
   * @return {Case}
   */
  then(value) {
    if (this._condition)
      this._expressions.push({
        condition: this._condition,
        value: value
      });
    return this;
  }

  /**
   * Defines "else" part of Case expression.
   *
   * @param {*} value
   * @public
   * @return {Case}
   */
  else(value) {
    this._elseValue = value;
    return this;
  }

  /**
   * Sets alias to case expression.
   *
   * @param {String} alias
   * @public
   * @return {Case}
   */
  as(alias) {
    this._alias = alias;
    return this;
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    if (!this._expressions.length)
      return '';
    const q = {
      expressions: [],
      elseValue: this._elseValue !== undefined ?
          Serializable.serializeObject(ctx, this._elseValue) : undefined
    };
    const arr = q.expressions;
    for (const x of this._expressions) {
      const o = {
        condition: x.condition._serialize(ctx),
        value: Serializable.serializeObject(ctx, x.value)
      };
      arr.push(o);
    }

    return Serializable.serializeFallback(ctx, 'case_expression', q, () => {
      let out = 'case\n\t';
      for (const o of arr) {
        out += 'when ' + o.condition + ' then ' + o.value + '\n';
      }
      if (q.elseValue !== undefined)
        out += 'else ' + q.elseValue + '\n';
      out += '\bend' + (this._alias ? ' ' + this._alias : '');
      return out;
    });
  }

}

/**
 * Expose `Case`.
 */
module.exports = Case;

