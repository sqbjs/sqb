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
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 * Expose `UpdateQuery`.
 */
module.exports = UpdateQuery;

/**
 * @param {String} tableName
 * @param {Object} values
 * @constructor
 * @public
 */
function UpdateQuery(tableName, values) {
  ReturningQuery.call(this);
  this.type = 'update';
  this._values = {};
  if (!tableName || !(typeof tableName === 'string' || tableName.isRaw))
    throw new ArgumentError('String or Raw instance required as first argument (tableName) for UpdateQuery');
  if (!values || !((typeof values === 'object' && !Array.isArray(values)) ||
          values.isSelect))
    throw new ArgumentError('Object or Raw instance required as second argument (values) for UpdateQuery');
  this._table = tableName.isRaw ? tableName : new TableName(tableName);
  this._values = values;
}

UpdateQuery.prototype = {
  get isUpdate() {
    return true;
  }
};
Object.setPrototypeOf(UpdateQuery.prototype, ReturningQuery.prototype);
UpdateQuery.prototype.constructor = UpdateQuery;

/**
 *
 * @param {...Operator} operator
 * @return {SelectQuery}
 * @public
 */
UpdateQuery.prototype.where = function(operator) {
  this._where = this._where || new OpAnd();
  this._where.add.apply(this._where, arguments);
  return this;
};

UpdateQuery.prototype._serialize = function(ctx) {
  /* Call super */
  ReturningQuery.prototype._serialize.call(ctx);

  const o = {
    table: this._table._serialize(ctx),
    values: serializeValues(this, ctx),
    where: serializeWhere(this, ctx),
    returning: this._serializeReturning(this, ctx)
  };

  var out = 'update ' + o.table + ' set \n\t' + o.values + '\b';
  if (o.where)
    out += '\n' + o.where;
  if (o.returning)
    out += '\nreturning ' + o.returning;
  return out;
};

function serializeValues(query, ctx) {
  const arr = [];
  const allValues = query._values;
  Object.getOwnPropertyNames(allValues).forEach(function(n) {
    arr.push({
      field: n,
      value: Serializable.serializeObject(ctx, allValues[n])
    });
  });
  return Serializable.serializeFallback(ctx, 'update_values', arr, function() {
    arr.forEach(function(o, i) {
      arr[i] = o.field + ' = ' + o.value;
    });
    return Serializable.joinArray(arr, ',');
  });
}

function serializeWhere(query, ctx) {
  if (!query._where)
    return '';
  const s = query._where._serialize(ctx);
  return Serializable.serializeFallback(ctx, 'where', s, function() {
    /* istanbul ignore next */
    return s ? 'where ' + s : '';
  });
}