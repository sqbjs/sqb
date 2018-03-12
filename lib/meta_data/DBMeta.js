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
const Op = require('../sqb_ns').Op;
const DBMetaSelect = require('./DBMetaSelect');
const MetaDataSchema = require('./SchemaMeta');
const extensions = require('../extensions');

/**
 * @class
 */

class DBMeta {
  /**
   * @param {Pool|Connection} dbObj
   * @constructor
   */
  constructor(dbObj) {
    if (!(dbObj && typeof dbObj.execute === 'function'))
      throw new Error('Pool or Connection instance required for first argument');
    const pool = dbObj.dialect ? dbObj : dbObj.pool;
    const metaOp = extensions.createMetaOperator({dialect: pool.dialect});
    /* istanbul ignore next */
    if (!metaOp)
      throw new Error('No meta-data extension found for "' +
          pool.dialect + '" dialect');
    this._dbObj = dbObj;
    this._metaOp = metaOp;
    /* istanbul ignore else */
    if (!metaOp.supportsSchemas) {
      this._dbmeta = this;
      Object.assign(this, MetaDataSchema.prototype);
    }
  }

  invalidate() {
    /* istanbul ignore else */
    if (typeof this._metaOp.invalidate === 'function') {
      typeof this._metaOp.invalidate();
      return true;
    }
  }

  select(...columns) {
    return new DBMetaSelect(this, ...columns);
  }

  getSchemas(schemaName, callback) {
    if (typeof schemaName === 'function') {
      callback = schemaName;
      schemaName = undefined;
    }
    if (!callback)
      return promisify.fromCallback((cb) => this.getSchemas(schemaName, cb));

    const query = this.select().from('schemas');
    if (schemaName)
      query.where(Op.like('schema_name', schemaName));
    query.execute({
      cursor: true,
      objectRows: true,
      naming: 'lowercase'
    }, (err, resp) => {
      /* istanbul ignore next */
      if (err)
        return callback(err);
      const result = [];
      resp.cursor.next((err, row, more) => {
        /* istanbul ignore next */
        if (err)
          return callback(err);
        if (row) {
          result.push(new MetaDataSchema(this, row));
          return more();
        }
        resp.cursor.close(() => {
          callback(null, result);
        });
      });
    });
  }

}

/**
 * Expose `DBMeta`.
 */

module.exports = DBMeta;
