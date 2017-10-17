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
const SqlObject = require('./sqlobject');

/**
 * Expose `TableName`.
 */
module.exports = TableName;

/**
 * @param {String} table
 * @constructor
 * @public
 */
function TableName(table) {
  SqlObject.call(this);
  const m = table.match(/^(?:(\w+)(?:\.))?([\w$]+) ?(?:as)? ?(\w+)?$/);
  if (!m)
    throw new ArgumentError('Invalid table name `%s`', table);
  this.type = 'table';
  this.schema = m[1];
  this.table = m[2];
  this.alias = m[3];
}

const proto = TableName.prototype = {};
Object.setPrototypeOf(proto, SqlObject.prototype);
proto.constructor = TableName;
