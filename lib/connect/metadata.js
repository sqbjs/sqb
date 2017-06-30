/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

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
  _getQuery(options) {
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
    const subst = this.meta._getQuery({
      type: 'list_schemas'
    });
    const st = this.meta.dbobj
        .select(...listFields)
        .from(subst);
    if (subst._onfetchrow && subst._onfetchrow.length)
      st.onFetchRow(...subst._onfetchrow);
    return st;
  }

  //noinspection JSUnusedGlobalSymbols
  tables(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (TableFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getQuery({
      type: 'list_tables'
    });
    const st = this.meta.dbobj
        .select(...listFields)
        .from(subst);
    if (subst._onfetchrow && subst._onfetchrow.length)
      st.onFetchRow(...subst._onfetchrow);
    return st;
  }

  columns(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (ColumnFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getQuery({
      type: 'list_columns'
    });
    const st = this.meta.dbobj
        .select(...listFields)
        .from(subst);
    if (subst._onfetchrow && subst._onfetchrow.length)
      st.onFetchRow(...subst._onfetchrow);
    return st;
  }

  //noinspection JSUnusedGlobalSymbols
  primaryKeys(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (PrimaryKeyFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getQuery({
      type: 'list_primary_keys'
    });
    const st = this.meta.dbobj
        .select(...listFields)
        .from(subst);
    if (subst._onfetchrow && subst._onfetchrow.length)
      st.onFetchRow(...subst._onfetchrow);
    return st;
  }

  //noinspection JSUnusedGlobalSymbols
  foreignKeys(...fields) {
    const listFields = [];
    for (let field of fields) {
      field = String(field).toLowerCase();
      if (ForeignKeyFields.includes(field) && !listFields.includes(field))
        listFields.push(field);
    }
    const subst = this.meta._getQuery({
      type: 'list_foreign_keys'
    });
    const st = this.meta.dbobj
        .select(...listFields)
        .from(subst);
    if (subst._onfetchrow && subst._onfetchrow.length)
      st.onFetchRow(...subst._onfetchrow);
    return st;
  }

}

module.exports = MetaData;
