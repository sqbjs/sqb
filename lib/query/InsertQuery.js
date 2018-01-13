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
const ReturningQuery = require('./ReturningQuery');
const TableName = require('../sqlobject/TableName');

/**
 * Expose `InsertQuery`.
 */

module.exports = InsertQuery;

/**
 * @param {string|Raw} tableName
 * @param {Object} values
 * @constructor
 * @public
 */
function InsertQuery(tableName, values) {
  ReturningQuery.call(this);
  this.type = 'insert';
  if (!tableName || !(typeof tableName === 'string' || tableName.isRaw))
    throw new ArgumentError('String or Raw instance required as first argument (tableName) for InsertQuery');
  if (!values || !((typeof values === 'object' && !Array.isArray(values)) ||
          values.isSelect))
    throw new ArgumentError('Object or SelectQuery instance required as second argument (values) for InsertQuery');
  this._table = tableName.isRaw ? tableName : new TableName(tableName);
  this._values = values;
}

InsertQuery.prototype = {
  get isInsert() {
    return true;
  }
};
Object.setPrototypeOf(InsertQuery.prototype, ReturningQuery.prototype);
InsertQuery.prototype.constructor = InsertQuery;

InsertQuery.prototype._serialize = function(ctx) {
  /* Call super */
  ReturningQuery.prototype._serialize.call(ctx);

  const o = {
    table: this._table._serialize(ctx),
    columns: serializeColumns(this, ctx),
    values: serializeValues(this, ctx),
    returning: this._serializeReturning(this, ctx)
  };

  var out = 'insert into ' + o.table + '\n\t(' +
      o.columns + ')\n\bvalues\n\t(' + o.values + ')\b';
  if (o.returning)
    out += '\nreturning ' + o.returning;
  return out;
};

function serializeColumns(query, ctx) {
  var arr;
  if (query._values.isSelect) {
    arr = [];
    const cols = query._values._columns;
    cols.forEach(function(col) {
      arr.push(col.alias || col.field);
    });
  } else
    arr = Object.getOwnPropertyNames(query._values);
  return Serializable.serializeFallback(ctx, 'insert_columns', arr, function() {
    return Serializable.joinArray(arr);
  });
}

function serializeValues(query, ctx) {
  if (query._values.isSelect) {
    return query._values._serialize(ctx);
  }
  const arr = [];
  const allValues = query._values;
  Object.getOwnPropertyNames(allValues).forEach(function(n) {
    arr.push(Serializable.serializeObject(ctx, allValues[n]));
  });
  return Serializable.serializeFallback(ctx, 'insert_values', arr, function() {
    return Serializable.joinArray(arr);
  });
}
