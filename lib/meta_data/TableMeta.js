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
const promisify = require('putil-promisify');
const defineConst = require('putil-defineconst');

/**
 * Expose `MetaData`.
 */

module.exports = MetaDataTable;

/**
 * @param {Object} owner
 * @param {Object} meta
 * @constructor
 */
function MetaDataTable(owner, meta) {
  defineConst(this, {
    _schema: owner,
    _dbmeta: owner._dbmeta,
    _dbObj: owner._dbObj,
    _driver: owner._driver
  }, false);
  this.meta = Object.assign({}, meta);
}

MetaDataTable.prototype.refresh = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.refresh(cb);
    });
  this._dbmeta._driver.metaData.getTableInfo(this._dbObj,
      self.meta.schema_name, self.meta.table_name,
      function(err, resp) {
        /* istanbul ignore next */
        if (err)
          return callback(err);
        self.columns = resp.columns;
        self.primaryKey = resp.primaryKey;
        self.foreignKeys = resp.foreignKeys;
        callback();
      });
};
