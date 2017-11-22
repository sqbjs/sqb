/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Expose `MetaDataSelect`.
 */

module.exports = MetaDataSelect;

/**
 *
 * @param {MetaData} owner
 * @param {...*} columns
 * @constructor
 */
function MetaDataSelect(owner, columns) {
  this.owner = owner;
  this.metaOperator = owner._metaOperator;
  if (!(this.metaOperator && this.metaOperator.getSelectSql))
    throw new Error('Current dialect does not support meta data operations');
  this.dbobj = owner.dbobj;
  this.pool = owner.dbobj.isConnection ? owner.dbobj.pool : owner.dbobj;
  this._columns = Array.prototype.slice.call(arguments, 1);
}

MetaDataSelect.prototype.from = function(tableName) {
  const _columns = this._columns && this._columns.length ? this._columns : null;
  const sql = this.metaOperator.getSelectSql(String(tableName).toLowerCase());
  return this.dbobj.select(_columns)
      .from(this.pool.raw('(' + sql + ')'));
};
