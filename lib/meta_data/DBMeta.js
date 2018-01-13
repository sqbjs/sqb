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
const Op = require('../sqb_ns').Op;
const DBMetaSelect = require('./DBMetaSelect');
const MetaDataSchema = require('./SchemaMeta');
const extensions = require('../extensions');

/**
 * Expose `DBMeta`.
 */

module.exports = DBMeta;

/**
 * @param {Pool|Connection} dbObj
 * @constructor
 */
function DBMeta(dbObj) {
  if (!(dbObj && typeof dbObj.execute === 'function'))
    throw new Error('Pool or Connection instance required for first argument');
  var pool = dbObj.dialect ? dbObj : dbObj.pool;
  const metaOp = extensions.createMetaOperator({dialect: pool.dialect});
  /* istanbul ignore next */
  if (!metaOp)
    throw new Error('No meta-data extension found for "' +
        pool.dialect + '" dialect');
  defineConst(this, {
    _dbObj: dbObj,
    _metaOp: metaOp
  }, false);
  /* istanbul ignore else */
  if (!metaOp.supportsSchemas) {
    defineConst(this, '_dbmeta', this, false);
    Object.assign(this, MetaDataSchema.prototype);
  }
}

DBMeta.prototype.invalidate = function() {
  /* istanbul ignore else */
  if (typeof this._metaOp.invalidate === 'function') {
    typeof this._metaOp.invalidate();
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
    query.where(Op.like('schema_name', schemaName));
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
