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
const Op = require('../sqb_ns').Op;
const DBMetaSelect = require('./DBMetaSelect');
const SchemaMeta = require('./SchemaMeta');
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
    if (!metaOp.supportsSchemas)
      this._dbmeta = this;
  }

  invalidate() {
    /* istanbul ignore else */
    if (typeof this._metaOp.invalidate === 'function') {
      typeof this._metaOp.invalidate();
      return true;
    }
  }

  select(...columns) {
    return new DBMetaSelect(this, columns);
  }

  /**
   *
   * @param {String} nameLike
   * @return {Promise}
   */
  getSchemas(nameLike) {
    const query = this.select().from('schemas');
    if (nameLike)
      query.where(Op.like('schema_name', nameLike));
    return query.execute({
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }).then(resp => {
      if (!resp.rows)
        return [];
      const result = [];
      for (const row of resp.rows) {
        result.push(new SchemaMeta(this, row));
      }
      return result;
    });
  }

  /**
   *
   * @param {String} tableLike
   * @return {Promise<Array>}
   */
  getTables(tableLike) {
    if (this._dbmeta.supportsSchemas)
      throw new Error('Can not query tables directly. Dialect supports schemas');
    return SchemaMeta.prototype.getTables.call(this, tableLike);
  }

}

/**
 * Expose `DBMeta`.
 */

module.exports = DBMeta;
