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

/**
 * Expose `DatabaseMetaData`.
 */

module.exports = DatabaseMetaData;

/**
 * @param {DbPool|Connection} dbobj
 * @constructor
 */
function DatabaseMetaData(dbobj) {
  this.dbobj = dbobj;
}

const proto = DatabaseMetaData.prototype = {};
proto.constructor = DatabaseMetaData;

proto.select = function(column) {
  const o = Object.create(MetaDataSelect.prototype);
  const args = [this.dbobj].concat(Array.prototype.slice.call(arguments));
  MetaDataSelect.apply(o, args);
  return o;
};

/**
 *
 * @param {Object} dbobj
 * @param {...*} columns
 * @constructor
 */
function MetaDataSelect(dbobj, columns) {
  this.dbobj = dbobj;
  this.dbpool = dbobj.isConnection ? dbobj.dbpool : dbobj;
  this._columns = Array.prototype.slice.call(arguments, 1);
}

const proto2 = MetaDataSelect.prototype = {};
proto2.constructor = MetaDataSelect;

proto2.from = function(tableName) {
  const nastedPool = this.dbpool.nastedPool;
  const nastedMeta = nastedPool.metaData;
  if (!nastedMeta)
    throw new Error('Database wrapper plugin does not support metaData operations');
  var sql;
  const _columns = this._columns && this._columns.length ? this._columns : null;

  if (tableName === 'schemas') {
    if (nastedMeta.selectSchemas === 'function')
      throw new Error('Database wrapper plugin does not support selecting schemas');
    sql = nastedMeta.selectSchemas(_columns);

  } else if (tableName === 'tables') {
    if (nastedMeta.selectTables === 'function')
      throw new Error('Database wrapper plugin does not support selecting tables');
    sql = nastedMeta.selectTables(_columns);

  } else if (tableName === 'columns') {
    if (nastedMeta.selectColumns === 'function')
      throw new Error('Database wrapper plugin does not support selecting columns');
    sql = nastedMeta.selectColumns(_columns);

  } else if (tableName === 'primary_keys') {
    if (nastedMeta.selectPrimaryKeys === 'function')
      throw new Error('Database wrapper plugin does not support selecting primary keys');
    sql = nastedMeta.selectPrimaryKeys(_columns);

  } else if (tableName === 'foreign_keys') {
    if (nastedMeta.selectForeignKeys === 'function')
      throw new Error('Database wrapper plugin does not support selecting foreign keys');
    sql = nastedMeta.selectForeignKeys(_columns);
  } else
    throw new ArgumentError('Unknown table `%s`', tableName);

  return this.dbobj.select(_columns)
      .from(this.dbobj.raw('(' + sql + ')'));
};

