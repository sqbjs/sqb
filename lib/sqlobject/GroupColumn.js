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

const GROUP_COLUMN_PATTERN = /^((?:[a-zA-Z][\w$]*\.){0,2})([a-zA-Z][\w$]*)$/;

/**
 * Expose `GroupColumn`.
 */
module.exports = GroupColumn;

/**
 * @param {String} value
 * @constructor
 * @public
 */
function GroupColumn(value) {
  Serializable.call(this);
  this.type = 'order';
  const m = value.match(GROUP_COLUMN_PATTERN);
  if (!m)
    throw new ArgumentError('(%s) does not match order column format', value);
  this.field = m[2];
  if (m[1]) {
    const a = m[1].split(/\./g);
    a.pop();
    this.table = a.pop();
    this.schema = a.pop();
  }
}

Object.setPrototypeOf(GroupColumn.prototype, Serializable.prototype);

GroupColumn.prototype._serialize = function(ctx) {
  const self = this;
  const o = {
    schema: this.schema,
    table: this.table,
    field: this.field,
    isReservedWord: Serializable.isReserved(ctx, this.field)
  };
  return Serializable.serializeFallback(ctx, 'group_column', o, function() {
    return (self.schema ? self.schema + '.' : '') +
        (self.table ? self.table + '.' : '') +
        (o.isReservedWord ? '"' + self.field + '"' : self.field);
  });
};
