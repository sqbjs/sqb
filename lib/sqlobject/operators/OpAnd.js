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

/**
 * Expose `OpAnd`.
 */
module.exports = OpAnd;

/**
 * @param {...Operator} operator
 * @constructor
 * @public
 */
function OpAnd(operator) {
  Operator.call(this);
  this._items = [];
  this.add.apply(this, arguments);
}

OpAnd.prototype.operatorType = 'and';

Object.setPrototypeOf(OpAnd.prototype, Operator.prototype);
OpAnd.prototype.constructor = OpAnd;

/**
 * @param {...Operator} operator
 * @public
 */
OpAnd.prototype.add = function(operator) {
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (!arg) continue;
    if (!arg.isOperator)
      throw new ArgumentError('Operator type required');
    this._items.push(arg);
  }
};

OpAnd.prototype._serialize = function(ctx) {
  const arr = [];
  this._items.forEach(function(t) {
    const s = t._serialize(ctx);
    /* istanbul ignore else */
    if (s)
      arr.push((t.operatorType === 'and' || t.operatorType === 'or') ?
          '(' + s + ')' : s);
  });
  return Serializable.serializeFallback(ctx, 'operator_and', arr, function() {
    var s = Serializable.joinArray(arr, ' and');
    return (s.indexOf('n') > 0) ? s.replace('\n', '\n\t') + '\b' : s;
  });
};
