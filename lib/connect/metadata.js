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
const assert = require('assert');

const SchemaFields = ['schema_name', 'create_date'];
const TableFields = ['schema_name', 'table_name', 'table_comments', 'num_rows',
  'read_only'];
const ColumnFields = ['schema_name', 'table_name', 'column_name', 'data_type',
  'data_length', 'data_precision', 'data_scale', 'nullable',
  'column_comments'];
const PrimaryKeyFields = ['schema_name', 'table_name', 'constraint_name',
  'status', 'columns'];
const ForeignKeyFields = ['schema_name', 'table_name', 'constraint_name',
  'status', 'column_name', 'r_schema', 'r_table_name', 'r_columns'];

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
  MetaDataSelect.apply(o, arguments);
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
  this._columns = columns;
}

const proto2 = MetaDataSelect.prototype = {};
proto2.constructor = MetaDataSelect;

proto2.from = function(tableName) {
  tableName = String(tableName);
  assert(['schemas', 'tables', 'columns', 'primary_keys',
    'foreign_keys'].includes(tableName
      .toLowerCase()), 'Unknown table "' + tableName + '"');
  var subSelect;
  var sourceFields;
  const listFields = [];

  const plugin = this.dbpool.nastedPool;
  if (tableName === 'schemas') {
    assert(typeof plugin.metaDataSelectSchemas === 'function',
        'Connecting plugin does not support "metaDataSelectSchemas"');

    sourceFields = SchemaFields;
    subSelect = plugin.metaDataSelectSchemas(this.dbobj);

  } else if (tableName === 'tables') {
    assert(typeof plugin.metaDataSelectTables === 'function',
        'Connecting plugin does not support "metaDataSelectTables"');
    sourceFields = TableFields;
    subSelect = plugin.metaDataSelectTables(this.dbobj);

  } else if (tableName === 'columns') {
    assert(typeof plugin.metaDataSelectColumns === 'function',
        'Connecting plugin does not support "metaDataSelectColumns"');
    sourceFields = ColumnFields;
    subSelect = plugin.metaDataSelectColumns(this.dbobj);

  } else if (tableName === 'primary_keys') {
    assert(typeof plugin.metaDataSelectPrimaryKeys === 'function',
        'Connecting plugin does not support "metaDataSelectPrimaryKeys"');
    sourceFields = PrimaryKeyFields;
    subSelect = plugin.metaDataSelectPrimaryKeys(this.dbobj);

  } else if (tableName === 'foreign_keys') {
    assert(typeof plugin.metaDataSelectForeignKeys === 'function',
        'Connecting plugin does not support "metaDataSelectForeignKeys"');
    sourceFields = ForeignKeyFields;
    subSelect = plugin.metaDataSelectForeignKeys(this.dbobj);
  }

  this._columns.forEach(function(col) {
    col = String(col).toLowerCase();
    if (sourceFields.includes(col) && !listFields.includes(col))
      listFields.push(col);
  });

  const query = this.dbobj.select.apply(this.dbobj, listFields)
      .from(subSelect);
  if (subSelect._onfetchrow && subSelect._onfetchrow.length)
    subSelect._onfetchrow.forEach(function(fn) {
      query.onFetchRow(fn);
    });
  return query;
};

