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
 * Expose `TableName`.
 */
module.exports = TableName;

/**
 * @param {String} tableName
 * @constructor
 * @public
 */
function TableName(tableName) {
  Serializable.call(this);
  this.type = 'table';
  const m = tableName.match(/^(?:([a-zA-Z]\w*)\.)? *([a-zA-Z]\w*) *(?:as)? *(\w+)?$/);
  if (!m)
    throw new ArgumentError('(%s) does not match table name format', tableName);
  this.schema = m[1];
  this.table = m[2];
  this.alias = m[3];
}

Object.setPrototypeOf(TableName.prototype, Serializable.prototype);

TableName.prototype._serialize = function(ctx) {
  const self = this;
  return Serializable.serializeFallback(ctx, 'table_name', {
    schema: this.schema,
    table: this.table,
    alias: this.alias
  }, function() {
    return (self.schema ? self.schema + '.' : '') + self.table +
        (self.alias ? ' ' + self.alias : '');
  });
};
