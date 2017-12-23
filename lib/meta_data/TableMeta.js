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
    _metaOp: owner._metaOp
  }, false);
  this.meta = Object.assign({}, meta);
}

MetaDataTable.prototype.getColumns = function(callback) {

  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.getColumns(cb);
    });

  /* istanbul ignore next */
  if (this._metaOp.getTableColumns) {
    this._metaOp.getTableColumns(this._dbObj,
        this.meta.schema_name, this.meta.table_name,
        callback);
    return;
  }

  self._dbmeta.select()
      .from('columns')
      .where(['schema_name', this.meta.schema_name],
          ['table_name', this.meta.table_name])
      .execute({
        fetchRows: 0,
        objectRows: true,
        naming: 'lowercase'
      }, function(err, resp) {
        if (err)
          return callback(err);
        const result = {};
        resp.rows.forEach(function(row) {
          row = result[row.column_name] = Object.assign(row);
          delete row.schema_name;
          delete row.table_name;
          delete row.column_name;
        });
        callback(null, result);
      });
};

MetaDataTable.prototype.getPrimaryKey = function(callback) {

  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.getPrimaryKey(cb);
    });

  /* istanbul ignore next */
  if (this._metaOp.getTablePrimaryKey) {
    this._metaOp.getTablePrimaryKey(this._dbObj,
        this.meta.schema_name, this.meta.table_name, callback);
    return;
  }

  self._dbmeta.select()
      .from('primary_keys')
      .where(['schema_name', this.meta.schema_name],
          ['table_name', this.meta.table_name])
      .execute({
        fetchRows: 0,
        objectRows: true,
        naming: 'lowercase'
      }, function(err, resp) {
        if (err)
          return callback(err);
        callback(null, resp.rows[0]);
      });
};

MetaDataTable.prototype.getForeignKeys = function(callback) {

  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.getForeignKeys(cb);
    });

  /* istanbul ignore next */
  if (this._metaOp.getTableForeignKeys) {
    this._metaOp.getTablePrimaryKey(this._dbObj,
        this.meta.schema_name, this.meta.table_name,
        callback);
    return;
  }

  self._dbmeta.select()
      .from('foreign_keys')
      .where(['schema_name', this.meta.schema_name],
          ['table_name', this.meta.table_name])
      .execute({
        fetchRows: 0,
        objectRows: true,
        naming: 'lowercase'
      }, function(err, resp) {
        if (err)
          return callback(err);
        callback(null, resp.rows);
      });
};
