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

const TABLE_COLUMN_PATTERN = /^((?:[a-zA-Z][\w$]*\.){0,2}) *([a-zA-Z][\w$]*|\*) *(?:as)? *([a-zA-Z][\w$]*)?$/;

/**
 * Expose `TableColumn`.
 */
module.exports = TableColumn;

/**
 * @param {String} value
 * @constructor
 * @public
 */
function TableColumn(value) {
  Serializable.call(this);
  this.type = 'column';
  const m = value.match(TABLE_COLUMN_PATTERN);
  if (!m)
    throw new ArgumentError('(%s) does not match table column format', value);
  this.field = m[2];
  if (m[1]) {
    const a = m[1].split(/\./g);
    a.pop();
    this.table = a.pop();
    this.schema = a.pop();
  }
  this.alias = this.field !== '*' ? m[3] : '';
}

Object.setPrototypeOf(TableColumn.prototype, Serializable.prototype);

TableColumn.prototype._serialize = function(ctx) {
  const self = this;
  const o = {
    schema: this.schema,
    table: this.table,
    field: this.field,
    alias: this.alias,
    isReservedWord: Serializable.isReserved(ctx, this.field)
  };
  return Serializable.serializeFallback(ctx, 'table_column', o, function() {
    return (self.schema ? self.schema + '.' : '') +
        (self.table ? self.table + '.' : '') +
        (o.isReservedWord ? '"' + self.field + '"' : self.field) +
        (self.alias ? ' ' + self.alias : '');
  });
};
