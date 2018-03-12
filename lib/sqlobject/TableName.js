/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const ArgumentError = require('errorex').ArgumentError;
const Serializable = require('../Serializable');

/**
 *
 * @class
 */
class TableName extends Serializable {
  /**
   * @param {String} tableName
   * @constructor
   * @public
   */
  constructor(tableName) {
    super();
    this.type = 'table';
    const m = tableName.match(/^(?:([a-zA-Z][\w$]*)\.)? *([a-zA-Z][\w$]*) *(?:as)? *(\w+)?$/);
    if (!m)
      throw new ArgumentError('(%s) does not match table name format', tableName);
    this.schema = m[1];
    this.table = m[2];
    this.alias = m[3];
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    return Serializable.serializeFallback(ctx, 'table_name', {
      schema: this.schema,
      table: this.table,
      alias: this.alias
    }, () => {
      return (this.schema ? this.schema + '.' : '') + this.table +
          (this.alias ? ' ' + this.alias : '');
    });
  }
}

/**
 * Expose `TableName`.
 */
module.exports = TableName;

