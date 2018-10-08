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
const {ArgumentError} = require('errorex');
const Query = require('./Query');
const Serializable = require('../Serializable');

const RETURNING_COLUMN_PATTERN = /^((?:[a-zA-Z]\w*\.){0,2}) *([a-zA-Z]\w*) *(?:as)? *(\w+)?$/;

/**
 *
 * @class
 * @abstract
 */
class ReturningQuery extends Query {
  /**
   * @constructor
   * @public
   */
  constructor() {
    super();
  }

  /**
   *
   * @param {Object|Array<String>} values
   * @return {ReturningQuery}
   */
  returning(values) {
    if (values) {
      const arr = [];
      if (typeof values !== 'object')
        throw new ArgumentError('Object argument required');
      for (const n of Object.getOwnPropertyNames(values)) {
        if (['string', 'number', 'date', 'blob', 'clob']
            .indexOf(values[n]) < 0)
          throw new ArgumentError('Unknown data type `%s`', values[n]);
        const m = n.match(RETURNING_COLUMN_PATTERN);
        if (!m)
          throw new ArgumentError('(%s) does not match column format', n);
        const o = {};
        o.field = m[2];
        if (m[1]) {
          const a = m[1].split(/\./g);
          a.pop();
          o.table = a.pop();
          o.schema = a.pop();
        }
        o.alias = m[3];
        o.dataType = values[n];
        arr.push(o);
      }
      this._returning = arr;
    } else
      this._returning = undefined;
    return this;
  }

  /**
   *
   * @param {Object} ctx
   * @return {string}
   * @protected
   */
  _serializeReturning(ctx) {
    if (!this._returning)
      return '';
    ctx.isReturningQuery = true;
    const arr = [];
    for (const t of this._returning) {
      const o = Object.assign({}, t);
      o.isReservedWord = Serializable.isReserved(ctx, t.field);
      arr.push(o);
    }
    return Serializable.serializeFallback(ctx, 'returning', arr, () => {
      const a = [];
      for (const o of arr) {
        a.push((o.schema ? o.schema + '.' : '') +
            (o.table ? o.table + '.' : '') +
            (o.isReservedWord ? '"' + o.field + '"' : o.field) +
            (o.alias ? ' ' + o.alias : ''));
      }
      return Serializable.joinArray(a);
    });
  }

}

/**
 * Expose `ReturningQuery`.
 */
module.exports = ReturningQuery;
