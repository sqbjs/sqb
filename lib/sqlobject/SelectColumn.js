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
const {ArgumentError} = require('errorex');
const Serializable = require('../Serializable');

const TABLE_COLUMN_PATTERN = /^((?:[a-zA-Z_][\w$_]*\.){0,2}) *([0-9a-zA-Z_][\w$_]*|\*) *(?:as)? *([a-zA-Z_][\w$_]*)?$/;

/**
 *
 * @class
 */
class SelectColumn extends Serializable {
  /**
   * @param {String} value
   * @constructor
   * @public
   */
  constructor(value) {
    super();
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

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    const o = {
      schema: this.schema,
      table: this.table,
      field: this.field,
      alias: this.alias,
      isReservedWord: Serializable.isReserved(ctx, this.field)
    };
    return Serializable.serializeFallback(ctx, 'select_column', o, () => {
      return (this.schema ? this.schema + '.' : '') +
          (this.table ? this.table + '.' : '') +
          (o.isReservedWord ? '"' + this.field + '"' : this.field) +
          (this.alias ? ' ' + this.alias : '');
    });
  }

}

/**
 * Expose `SelectColumn`.
 */
module.exports = SelectColumn;
