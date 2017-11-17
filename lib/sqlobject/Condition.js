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
const ArgumentError = require('errorex').ArgumentError;
const SqlObject = require('./SqlObject');

/**
 * Expose `Condition`.
 */
module.exports = Condition;

/**
 * @param {String} field
 * @param {String} operator
 * @param {*} value
 * @constructor
 * @public
 */
function Condition(field, operator, value) {
  SqlObject.call(this);
  if (typeof field === 'string') {
    const m = field.match(/^([a-z]\w*)\.?([a-z]\w*)?$/i);
    if (!m)
      throw new ArgumentError('Invalid value (%s) for `field` argument', field);
  } else if (!(field && (['select', 'raw'].indexOf(field.type) >= 0)))
    throw new ArgumentError('Invalid type (%s) for `field` argument', field.type);
  this.type = 'condition';
  this.field = field;
  this.logicalOperator = 'and';
  this.operator = '=';
  this.param = undefined;
  if (arguments.length > 2) {
    if (Condition.Operators.indexOf(operator) < 0)
      throw new ArgumentError('Invalid comparison operator');
    this.operator = operator || '=';
    this.value = value;
    if (['between', '!between', 'not between'].indexOf(this.operator) >= 0 &&
        !(value instanceof RegExp)) {
      this.value = Array.isArray(value) ? value : [value, value];
    }
  } else {
    this.value = operator;
  }
}

Condition.prototype = {
  get field() {
    return this._field;
  },

  set field(val) {
    this._field = val;
  },

  get param() {
    return this._param;
  },

  set param(val) {
    return this._param = val;
  },

  get value() {
    return this._value;
  },

  set value(val) {
    if (val instanceof RegExp) {
      this._value = undefined;
      this._param = val.source;
    } else {
      this._param = undefined;
      this._value = val;
    }
  },

  get operator() {
    return this._operator;
  },

  set operator(operator) {
    if (Condition.Operators.indexOf(operator) < 0)
      throw new ArgumentError('Invalid comparison operator `%s`', operator);
    this._operator = operator;
  }
};
Object.setPrototypeOf(Condition.prototype, SqlObject.prototype);
Condition.prototype.constructor = Condition;

Condition.Operators = [
  '=',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  '<>',
  '!<',
  '!>',
  'is',
  'like',
  '!like',
  'not like',
  'between',
  '!between',
  'not between'];
