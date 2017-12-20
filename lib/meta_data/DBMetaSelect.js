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
const defineConst = require('putil-defineconst');

/**
 * Expose `DBMetaSelect`.
 */

module.exports = DBMetaSelect;

/**
 * @param {Object} dbmeta
 * @param {Array} columns
 * @constructor
 */
function DBMetaSelect(dbmeta, columns) {
  defineConst(this, {
    _dbmeta: dbmeta,
    _dbobj: dbmeta._dbObj,
    _driver: dbmeta._driver,
    _columns: columns
  }, false);
}

DBMetaSelect.prototype.from = function(table) {
  var subQuery;
  switch (String(table).toLowerCase()) {
    case 'schemas':
      if (!this._driver.metaData.querySchemas)
        /* istanbul ignore next */
        throw new Error(this._driver.dialect +
            ' dialect does not support querying meta-data for schemas');
      subQuery = this._driver.metaData.querySchemas(this._dbobj);
      break;
    case 'tables':
      subQuery = this._driver.metaData.queryTables(this._dbobj);
      break;
    case 'columns':
      subQuery = this._driver.metaData.queryColumns(this._dbobj);
      break;
    case 'primary_keys':
      subQuery = this._driver.metaData.queryPrimaryKeys(this._dbobj);
      break;
    case 'foreign_keys':
      subQuery = this._driver.metaData.queryForeignKeys(this._dbobj);
      break;
    default:
      throw new Error('Unknown table "' + table + '"');
  }
  const query = this._dbobj.select.apply(this._dbobj, this._columns)
      .from(subQuery.as('t'));
  Object.assign(query._events, subQuery._events);
  Object.assign(query._hooks, subQuery._hooks);
  return query;
};
