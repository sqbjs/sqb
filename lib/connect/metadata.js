/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
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
 * @class
 * @public
 */
class DatabaseMetaData {

  /**
   *
   * @param {DbPool|Connection} dbobj
   */
  constructor(dbobj) {
    this.dbobj = dbobj;
  }

  select(...columns) {
    return new MetaDataSelect(this.dbobj, columns);
  }

}

class MetaDataSelect {

  constructor(dbobj, columns) {
    this.dbobj = dbobj;
    this.dbpool = dbobj.isConnection ? dbobj.dbpool : dbobj;
    this._columns = columns;
  }

  from(tableName) {
    tableName = String(tableName);
    assert(['schemas', 'tables', 'columns', 'primary_keys',
      'foreign_keys'].includes(tableName
        .toLowerCase()), 'Unknown table "' + tableName + '"');
    let subSelect;
    let sourceFields;
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

    for (let col of this._columns) {
      col = String(col).toLowerCase();
      if (sourceFields.includes(col) && !listFields.includes(col))
        listFields.push(col);
    }

    const query = this.dbobj
        .select(...listFields)
        .from(subSelect);
    if (subSelect._onfetchrow && subSelect._onfetchrow.length)
      for (const fn of subSelect._onfetchrow)
        query.onFetchRow(fn);
    return query;
  }

}

module.exports = DatabaseMetaData;
