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
const merge = require('putil-merge');
const Op = require('../sqb_ns').Op;

/**
 * @class
 */
class MetaDataTable {
  /**
   * @param {Object} owner
   * @param {Object} meta
   * @constructor
   */
  constructor(owner, meta) {
    this._dbmeta = owner._dbmeta;
    this._dbObj = owner._dbObj;
    this._metaOp = owner._metaOp;
    this.meta = Object.assign({}, meta);
  }

  getColumns(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.getColumns(cb));

    /* istanbul ignore next */
    if (this._metaOp.getTableColumns) {
      this._metaOp.getTableColumns(this._dbObj,
          this.meta.schema_name, this.meta.table_name,
          callback);
      return;
    }

    const query = this._dbmeta.select()
        .from('columns')
        .where(Op.eq('table_name', this.meta.table_name));
    /* istanbul ignore next */
    if (this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    query.execute({
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }, (err, resp) => {
      /* istanbul ignore next */
      if (err)
        return callback(err);
      const result = {};
      for (const row of resp.rows) {
        const r = result[row.column_name] = merge({}, row);
        delete r.schema_name;
        delete r.table_name;
        delete r.column_name;
      }
      callback(null, result);
    });
  }

  getPrimaryKey(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.getPrimaryKey(cb));

    /* istanbul ignore next */
    if (this._metaOp.getTablePrimaryKey) {
      this._metaOp.getTablePrimaryKey(this._dbObj,
          this.meta.schema_name, this.meta.table_name, callback);
      return;
    }

    const query = this._dbmeta.select()
        .from('primary_keys')
        .where(Op.eq('table_name', this.meta.table_name));
    /* istanbul ignore next */
    if (this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    query.execute({
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }, (err, resp) => {
      /* istanbul ignore next */
      if (err)
        return callback(err);
      callback(null, resp.rows[0]);
    });
  }

  getForeignKeys(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.getForeignKeys(cb));

    /* istanbul ignore next */
    if (this._metaOp.getTableForeignKeys) {
      this._metaOp.getTableForeignKeys(this._dbObj,
          this.meta.schema_name, this.meta.table_name,
          callback);
      return;
    }

    const query = this._dbmeta.select()
        .from('foreign_keys')
        .where(Op.eq('table_name', this.meta.table_name));
    /* istanbul ignore next */
    if (this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    query.execute({
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }, (err, resp) => {
      /* istanbul ignore next */
      if (err)
        return callback(err);
      callback(null, resp.rows);
    });
  }

}

/**
 * Expose `MetaData`.
 */

module.exports = MetaDataTable;
