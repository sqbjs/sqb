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
const MetaDataTable = require('./TableMeta');
const Op = require('../sqb_ns').Op;

/**
 * @class
 */
class SchemaMeta {
  /**
   * @param {Object} owner
   * @param {Object} meta
   * @constructor
   */
  constructor(owner, meta) {
    this._dbmeta = owner;
    this._dbObj = owner._dbObj;
    this._metaOp = owner._metaOp;
    this.meta = Object.assign({}, meta);
  }

  getTables(tableName, callback) {
    if (typeof tableName === 'function') {
      callback = tableName;
      tableName = undefined;
    }
    if (!callback)
      return promisify.fromCallback((cb) => this.getTables(tableName, cb));

    const query = this._dbmeta.select().from('tables');
    /* istanbul ignore else */
    if (this.meta && this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    if (tableName)
      query.where(Op.like('table_name', tableName));
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
          result.push(new MetaDataTable(this, row));
          return more();
        }
        resp.cursor.close(() => callback(null, result));
      });
    });
  }

}

/**
 * Expose `MetaData`.
 */

module.exports = SchemaMeta;
