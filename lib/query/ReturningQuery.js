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
const Query = require('./Query');
const Serializable = require('../Serializable');

const RETURNING_COLUMN_PATTERN = /^((?:[a-zA-Z]\w*\.){0,2}) *([a-zA-Z]\w*) *(?:as)? *(\w+)?$/;

/**
 * Expose `ReturningQuery`.
 */
module.exports = ReturningQuery;

/**
 * @constructor
 * @public
 */
function ReturningQuery() {
  Query.apply(this, arguments);
}

Object.setPrototypeOf(ReturningQuery.prototype, Query.prototype);
ReturningQuery.prototype.constructor = ReturningQuery;

/**
 *
 * @param {Object|Array<String>} values
 * @return {ReturningQuery}
 */
ReturningQuery.prototype.returning = function(values) {
  if (values) {
    const arr = [];
    if (typeof values !== 'object')
      throw new ArgumentError('Object argument required');
    Object.getOwnPropertyNames(values).forEach(function(n) {
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
    });
    this._returning = arr;
  } else
    this._returning = undefined;
  return this;
};

ReturningQuery.prototype._serializeReturning = function(query, ctx) {
  if (!query._returning)
    return '';
  const arr = [];
  query._returning.forEach(function(t) {
    const o = Object.assign({}, t);
    o.isReservedWord = Serializable.isReserved(ctx, t.field);
    arr.push(o);
  });
  return Serializable.serializeFallback(ctx, 'returning', arr, function() {
    const a = [];
    arr.forEach(function(o) {
      a.push((o.schema ? o.schema + '.' : '') +
          (o.table ? o.table + '.' : '') +
          (o.isReservedWord ? '"' + o.field + '"' : o.field) +
          (o.alias ? ' ' + o.alias : ''));
    });
    return Serializable.joinArray(a);
  });
};
