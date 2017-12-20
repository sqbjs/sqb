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
const DBMetaSelect = require('./DBMetaSelect');
const MetaDataSchema = require('./SchemaMeta');

/**
 * Expose `DBMeta`.
 */

module.exports = DBMeta;

/**
 * @param {Object} dbObj
 * @param {Object} driver
 * @constructor
 */
function DBMeta(dbObj, driver) {
  if (!driver.metaData)
    throw new Error('"' + driver.dialect +
        '" dialect does not support meta-data operations');
  defineConst(this, {
    _dbObj: dbObj,
    _driver: driver
  }, false);
  /* istanbul ignore else */
  if (!driver.supportsSchemas) {
    defineConst(this, '_dbmeta', this, false);
    Object.assign(this, MetaDataSchema.prototype);
  }
}

DBMeta.prototype.invalidate = function() {
  /* istanbul ignore else */
  if (typeof this._driver.metaData.invalidate === 'function') {
    typeof this._driver.metaData.invalidate();
    return true;
  }
};

DBMeta.prototype.select = function(columns) {
  return new DBMetaSelect(this, Array.prototype.slice.call(arguments));
};

DBMeta.prototype.getSchemas = function(schemaName, callback) {
  const self = this;
  if (typeof schemaName === 'function') {
    callback = schemaName;
    schemaName = undefined;
  }
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.getSchemas(schemaName, cb);
    });

  const query = this.select().from('schemas');
  if (schemaName)
    query.where(['schema_name', 'like', schemaName]);
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
        result.push(new MetaDataSchema(self, row));
        return more();
      }
      resp.cursor.close(function() {
        callback(null, result);
      });
    });
  });
};
