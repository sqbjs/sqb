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

const GROUP_COLUMN_PATTERN = /^((?:[a-zA-Z][\w$]*\.){0,2})([a-zA-Z][\w$]*)$/;

/**
 *
 * @class
 */
class GroupColumn extends Serializable {
  /**
   * @param {String} value
   * @constructor
   * @public
   */
  constructor(value) {
    super();
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

  /**
   * Process serialization
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
      isReservedWord: Serializable.isReserved(ctx, this.field)
    };
    return Serializable.serializeFallback(ctx, 'group_column', o, () => {
      return (this.schema ? this.schema + '.' : '') +
          (this.table ? this.table + '.' : '') +
          (o.isReservedWord ? '"' + this.field + '"' : this.field);
    });
  }

}

/**
 * Expose `GroupColumn`.
 */
module.exports = GroupColumn;
