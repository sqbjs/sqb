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
const Serializable = require('../Serializable');

/**
 * Expose `OrderColumn`.
 */
module.exports = OrderColumn;

/**
 * @param {String} value
 * @constructor
 * @public
 */
function OrderColumn(value) {
  Serializable.call(this);
  this.type = 'order';
  const m = value.match(/^([-+])?((?:[a-zA-Z][\w$]*\.){0,2}) *([a-zA-Z][\w$]*|\*) *(asc|desc|ascending|descending)?$/i);
  if (!m)
    throw new ArgumentError('(%s) does not match order column format', value);
  this.field = m[3];
  if (m[2]) {
    const a = m[2].split(/\./g);
    a.pop();
    this.table = a.pop();
    this.schema = a.pop();
  }
  this.descending = (m[1] === '-') ||
      (!m[1] && m[4] && ['desc', 'descending'].indexOf(m[4].toLowerCase()) >=
          0);
}

Object.setPrototypeOf(OrderColumn.prototype, Serializable.prototype);

OrderColumn.prototype._serialize = function(ctx) {
  const self = this;
  const o = {
    schema: this.schema,
    table: this.table,
    field: this.field,
    descending: !!this.descending,
    isReservedWord: Serializable.isReserved(ctx, this.field)
  };
  return Serializable.serializeFallback(ctx, 'order_column', o, function() {
    return (self.schema ? self.schema + '.' : '') +
        (self.table ? self.table + '.' : '') +
        (o.isReservedWord ? '"' + self.field + '"' : self.field) +
        (self.descending ? ' desc' : '');
  });
};
