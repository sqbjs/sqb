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

  get name() {
    return this.meta.schema_name;
  }

  /**
   *
   * @param {String} tableLike
   * @return {Promise<Array>}
   */
  getTables(tableLike) {
    const query = this._dbmeta.select().from('tables');
    /* istanbul ignore else */
    if (this.meta && this.name)
      query.where(Op.eq('schema_name', this.name));
    if (tableLike)
      query.where(Op.like('table_name', tableLike));
    return query.execute({
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }).then(resp => {
      const result = [];
      for (const row of resp.rows) {
        result.push(new MetaDataTable(this, row));
      }
      return result;
    });
  }

}

/**
 * Expose `MetaData`.
 */

module.exports = SchemaMeta;
