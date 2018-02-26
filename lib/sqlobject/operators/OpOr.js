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
 * Expose `OpOr`.
 */
module.exports = OpOr;

/**
 * @param {...Operator} operator
 * @constructor
 * @public
 */
function OpOr(operator) {
  Operator.call(this);
  this._items = [];
  this.add.apply(this, arguments);
}

OpOr.prototype.operatorType = 'or';

Object.setPrototypeOf(OpOr.prototype, Operator.prototype);
OpOr.prototype.constructor = OpOr;

/**
 * @param {...Operator} operator
 * @public
 */
OpOr.prototype.add = function(operator) {
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (!arg) continue;
    if (!(arg.isOperator || arg.isRaw))
      throw new ArgumentError('Operator or Raw type required');
    this._items.push(arg);
  }
};

OpOr.prototype._serialize = function(ctx) {
  const arr = [];
  this._items.forEach(function(t) {
    const s = t._serialize(ctx);
    /* istanbul ignore else */
    if (s)
      arr.push((t.operatorType === 'and' || t.operatorType === 'or') ?
          '(' + s + ')' : s);
  });
  return Serializable.serializeFallback(ctx, 'operator', arr, function() {
    var s = Serializable.joinArray(arr, ' or');
    return (s.indexOf('n') > 0) ? s.replace('\n', '\n\t') + '\b' : s;
  });
};
