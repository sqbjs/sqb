/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

const SchemaFields = ['schema_name', 'create_date'];
const TableFields = ['schema_name', 'table_name', 'table_comments', 'num_rows',
  'logging',
  'partitioned', 'read_only'];
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
class MetaData {

  /**
   *
   * @param {DbPool|Connection} dbobj
   */
  constructor(dbobj) {
    this.dbobj = dbobj;
  }

  select() {
    return new MetaDataSelect(this);
  }

  /**
   *
   * @param {Object} options
   * @protected
   * @abstract
   */
  _getStatement(options) {
  }

}

class MetaDataSelect {

  constructor(meta) {
    this.meta = meta;
  }

  //noinspection JSUnusedGlobalSymbols
  schemas(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (SchemaFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getStatement({
      type: 'list_schemas',
      fields: listFields
    });
    return this.meta.dbobj.select().from(subst).onFetchRow(subst._onfetchrow);
  }

  //noinspection JSUnusedGlobalSymbols
  tables(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (TableFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getStatement({
      type: 'list_tables',
      fields: listFields
    });
    return this.meta.dbobj.select().from(subst).onFetchRow(subst._onfetchrow);
  }

  columns(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (ColumnFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getStatement({
      type: 'list_columns',
      fields: listFields
    });
    return this.meta.dbobj.select().from(subst).onFetchRow(subst._onfetchrow);
  }

  //noinspection JSUnusedGlobalSymbols
  primaryKeys(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (PrimaryKeyFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getStatement({
      type: 'list_primary_keys',
      fields: listFields
    });
    return this.meta.dbobj.select().from(subst).onFetchRow(subst._onfetchrow);
  }

  //noinspection JSUnusedGlobalSymbols
  foreignKeys(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (ForeignKeyFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getStatement({
      type: 'list_foreign_keys',
      fields: listFields
    });
    return this.meta.dbobj.select().from(subst).onFetchRow(subst._onfetchrow);
  }

}

module.exports = MetaData;
