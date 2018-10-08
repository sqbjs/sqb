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

/**
 *
 * @class
 */
class OrderColumn extends Serializable {
  /**
   * @param {String} value
   * @constructor
   * @public
   */
  constructor(value) {
    super();
    this.type = 'order';
    const m = value.match(/^([-+])?((?:[a-zA-Z][\w$]*\.){0,2})([a-zA-Z][\w$]*|\*) *(asc|dsc|desc|ascending|descending)?$/i);
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
        (!m[1] && m[4] &&
            ['dsc', 'desc', 'descending'].indexOf(m[4].toLowerCase()) >= 0);
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
      descending: !!this.descending,
      isReservedWord: Serializable.isReserved(ctx, this.field)
    };
    return Serializable.serializeFallback(ctx, 'order_column', o, () => {
      return (o.schema ? o.schema + '.' : '') +
          (o.table ? o.table + '.' : '') +
          (o.isReservedWord ? '"' + o.field + '"' : o.field) +
          (o.descending ? ' desc' : '');
    });
  }

}

/**
 * Expose `OrderColumn`.
 */
module.exports = OrderColumn;
