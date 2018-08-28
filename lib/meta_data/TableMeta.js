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

  get name() {
    return this.meta.table_name;
  }

  /**
   *
   * @return {Promise<Object>}
   */
  getColumns() {
    /* istanbul ignore next */
    if (this._metaOp.getTableColumns) {
      return new Promise((resolve, reject) => {
        this._metaOp.getTableColumns(this._dbObj, this.meta.schema_name, this.meta.table_name,
            (err, result) => {
              if (err)
                return reject(err);
              resolve(result);
            });
      });
    }

    const query = this._dbmeta.select()
        .from('columns')
        .where(Op.eq('table_name', this.meta.table_name));
    /* istanbul ignore next */
    if (this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    return query.execute({
      cursor: false,
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }).then(resp => {
      const result = {};
      for (const row of resp.rows) {
        const r = result[row.column_name] = merge({}, row);
        delete r.schema_name;
        delete r.table_name;
        delete r.column_name;
      }
      return result;
    });
  }

  /**
   *
   * @return {Promise}
   */
  getPrimaryKey() {
    /* istanbul ignore next */
    if (this._metaOp.getTablePrimaryKey) {
      return new Promise((resolve, reject) => {
        this._metaOp.getTablePrimaryKey(this._dbObj,
            this.meta.schema_name, this.meta.table_name,
            (err, result) => {
              if (err)
                return reject(err);
              resolve(result);
            });
      });
    }

    const query = this._dbmeta.select()
        .from('primary_keys')
        .where(Op.eq('table_name', this.meta.table_name));
    /* istanbul ignore next */
    if (this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    return query.execute({
      fetchRows: 1,
      objectRows: true,
      naming: 'lowercase'
    }).then(resp => {
      return resp.rows[0];
    });
  }

  getForeignKeys() {
    /* istanbul ignore next */
    if (this._metaOp.getTableForeignKeys) {
      return new Promise((resolve, reject) => {
        this._metaOp.getTableForeignKeys(this._dbObj,
            this.meta.schema_name, this.meta.table_name,
            (err, result) => {
              if (err)
                return reject(err);
              resolve(result);
            });
      });
    }

    const query = this._dbmeta.select()
        .from('foreign_keys')
        .where(Op.eq('table_name', this.meta.table_name));
    /* istanbul ignore next */
    if (this.meta.schema_name)
      query.where(Op.eq('schema_name', this.meta.schema_name));
    return query.execute({
      cursor: false,
      fetchRows: 0,
      objectRows: true,
      naming: 'lowercase'
    }).then(resp => {
      return resp.rows;
    });
  }

}

/**
 * Expose `MetaData`.
 */

module.exports = MetaDataTable;
