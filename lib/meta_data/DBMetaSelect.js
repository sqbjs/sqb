/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * @class
 */
class DBMetaSelect {
  /**
   * @param {DBMeta} owner
   * @param {Array} columns
   * @constructor
   */
  constructor(owner, columns) {
    this._dbobj = owner._dbObj;
    this._metaOp = owner._metaOp;
    this._columns = columns;
  }

  from(table) {
    let subQuery;
    switch (String(table).toLowerCase()) {
      case 'schemas':
        /* istanbul ignore next */
        if (!this._metaOp.querySchemas)
          throw new Error(this._dbobj.dialect +
              ' dialect does not support querying meta-data for schemas');
        subQuery = this._metaOp.querySchemas(this._dbobj);
        break;
      case 'tables':
        subQuery = this._metaOp.queryTables(this._dbobj);
        break;
      case 'columns':
        subQuery = this._metaOp.queryColumns(this._dbobj);
        break;
      case 'primary_keys':
        subQuery = this._metaOp.queryPrimaryKeys(this._dbobj);
        break;
      case 'foreign_keys':
        subQuery = this._metaOp.queryForeignKeys(this._dbobj);
        break;
      default:
        throw new Error('Unknown table "' + table + '"');
    }
    const query = this._dbobj.select.apply(this._dbobj, this._columns)
        .from(subQuery.as(table));
    Object.assign(query._events, subQuery._events);
    Object.assign(query._hooks, subQuery._hooks);
    return query;
  }

}

/**
 * Expose `DBMetaSelect`.
 */

module.exports = DBMetaSelect;
