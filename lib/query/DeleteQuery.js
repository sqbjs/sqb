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
const TableName = require('../sqlobject/TableName');
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 * Expose `DeleteQuery`.
 */
module.exports = DeleteQuery;

/**
 * @param {String} tableName
 * @constructor
 * @public
 */
function DeleteQuery(tableName) {
  Query.call(this);
  this.type = 'delete';
  if (!tableName || !(typeof tableName === 'string' || tableName.isRaw))
    throw new ArgumentError('String or Raw instance required as first argument (tableName) for UpdateQuery');
  this._table = tableName.isRaw ? tableName : new TableName(tableName);
}

DeleteQuery.prototype = {
  get isDelete() {
    return true;
  }
};
Object.setPrototypeOf(DeleteQuery.prototype, Query.prototype);
DeleteQuery.prototype.constructor = DeleteQuery;

/**
 *
 * @param {...Operator} operator
 * @return {SelectQuery}
 * @public
 */
DeleteQuery.prototype.where = function(operator) {
  this._where = this._where || new OpAnd();
  this._where.add.apply(this._where, arguments);
  return this;
};

DeleteQuery.prototype._serialize = function(ctx) {
  /* Call super */
  Query.prototype._serialize.call(ctx);

  const o = {
    table: this._table._serialize(ctx),
    where: serializeWhere(this, ctx)
  };

  var out = 'delete from ' + o.table;
  if (o.where)
    out += '\n' + o.where;
  return out;
};

function serializeWhere(query, ctx) {
  if (!query._where)
    return '';
  const s = query._where._serialize(ctx);
  return Serializable.serializeFallback(ctx, 'where', s, function() {
    /* istanbul ignore next */
    return s ? 'where ' + s : '';
  });

}
