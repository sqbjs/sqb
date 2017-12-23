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
const MetaDataTable = require('./TableMeta');

/**
 * Expose `MetaData`.
 */

module.exports = MetaDataSchema;

/**
 * @param {Object} owner
 * @param {Object} meta
 * @constructor
 */
function MetaDataSchema(owner, meta) {
  defineConst(this, {
    _dbmeta: owner,
    _dbObj: owner._dbObj,
    _metaOp: owner._metaOp
  }, false);
  this.meta = Object.assign({}, meta);
}

MetaDataSchema.prototype.getTables = function(tableName, callback) {
  const self = this;
  if (typeof tableName === 'function') {
    callback = tableName;
    tableName = undefined;
  }
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.getTables(tableName, cb);
    });
  const query = this._dbmeta.select().from('tables');
  /* istanbul ignore else */
  if (self.meta && self.meta.schema_name)
    query.where(['schema_name', self.meta.schema_name]);
  if (tableName)
    query.where(['table_name', 'like', tableName]);
  query.execute({
    cursor: true,
    objectRows: true,
    naming: 'lowercase'
  }, function(err, resp) {
    /* istanbul ignore next */
    if (err)
      return callback(err);
    const result = [];
    resp.cursor.next(function(err, row, more) {
      /* istanbul ignore next */
      if (err)
        return callback(err);
      if (row) {
        result.push(new MetaDataTable(self, row));
        return more();
      }
      resp.cursor.close(function() {
        callback(null, result);
      });
    });
  });
};
