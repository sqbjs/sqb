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
const Serializable = require('../Serializable');
const OpAnd = require('./operators/OpAnd');

/**
 * Expose `Case`.
 */
module.exports = Case;

/**
 * @constructor
 * @public
 */
function Case() {
  Serializable.call(this);
  this.type = 'case';
  this._expressions = [];
}

Case.prototype = {
  get isCase() {
    return true;
  }
};

Object.setPrototypeOf(Case.prototype, Serializable.prototype);

Case.prototype.when = function(condition) {
  if (condition && arguments.length) {
    this._condition = Object.create(OpAnd.prototype);
    OpAnd.apply(this._condition, arguments);
  } else this._condition = null;
  return this;
};

Case.prototype.then = function(value) {
  if (this._condition)
    this._expressions.push({
      condition: this._condition,
      value: value
    });
  return this;
};

Case.prototype.as = function(alias) {
  this._alias = alias;
  return this;
};

Case.prototype.else = function(value) {
  this._elseValue = value;
  return this;
};

Case.prototype._serialize = function(ctx) {

  if (!this._expressions.length)
    return '';
  const self = this;
  const q = {
    expressions: [],
    elseValue: this._elseValue !== undefined ?
        Serializable.serializeObject(ctx, this._elseValue) : undefined
  };
  var arr = q.expressions;
  this._expressions.forEach(function(x) {
    const o = {
      condition: x.condition._serialize(ctx),
      value: Serializable.serializeObject(ctx, x.value)
    };
    arr.push(o);
  });

  return Serializable.serializeFallback(ctx, 'case_expression', q, function() {
    var out = 'case\n\t';
    arr.forEach(function(o) {
      out += 'when ' + o.condition + ' then ' + o.value + '\n';
    });
    if (q.elseValue !== undefined)
      out += 'else ' + q.elseValue + '\n';
    out += '\bend' + (self._alias ? ' ' + self._alias : '');
    return out;
  });
};
