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
const Operator = require('../Operator');
const Serializable = require('../../Serializable');
const isPlainObject = require('putil-isplainobject');

/**
 * Expose `LogicalOperator`.
 */
module.exports = LogicalOperator;

/**
 * @param {...Operator} operator
 * @constructor
 * @public
 */
function LogicalOperator(operator) {
  Operator.call(this);
  this._items = [];
  this.add.apply(this, arguments);
}

LogicalOperator.prototype.operatorType = 'and';

Object.setPrototypeOf(LogicalOperator.prototype, Operator.prototype);
LogicalOperator.prototype.constructor = LogicalOperator;

/**
 * @param {...Operator} operator
 * @public
 */
LogicalOperator.prototype.add = function(operator) {
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (!arg) continue;

    if (isPlainObject(arg)) {
      const args = wrapObject(arg);
      this.add.apply(this, args);
      continue;
    }
    if (!(arg.isOperator || arg.isRaw))
      throw new ArgumentError('Operator or Raw type required');
    this._items.push(arg);
  }
};

LogicalOperator.prototype._serialize = function(ctx) {
  const arr = [];
  this._items.forEach(function(t) {
    const s = t._serialize(ctx);
    /* istanbul ignore else */
    if (s)
      arr.push((t.operatorType === 'and' || t.operatorType === 'or') ?
          '(' + s + ')' : s);
  });
  const self = this;
  return Serializable.serializeFallback(ctx, 'operator', arr, function() {
    var s = Serializable.joinArray(arr, ' ' + self.operatorType);
    return (s.indexOf('n') > 0) ? s.replace('\n', '\n\t') + '\b' : s;
  });
};

function wrapObject(obj) {
  const Op = require('../../sqb_ns').Op;
  const result = [];
  Object.getOwnPropertyNames(obj).forEach(function(n) {
    var op;
    const v = obj[n];
    if (n === 'and' || n === 'or') {
      op = Op[n];
      result.push(Array.isArray(v) ? op.apply(null, v) : op(v));
      return;
    }
    const m = n.match(/^([\w$]+) *(.*)$/);
    if (!m)
      throw new ArgumentError('"%s" is not a valid definition', n);
    op = Op[m[2] || 'eq'];
    if (!op)
      throw new ArgumentError('Unknown operator "%s"', m[2]);
    result.push(op(m[1], obj[n]));
  });
  return result;
}
