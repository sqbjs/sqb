/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const SelectQuery = require('./query/SelectQuery');
const InsertQuery = require('./query/InsertQuery');
const UpdateQuery = require('./query/UpdateQuery');
const DeleteQuery = require('./query/DeleteQuery');
const Pool = require('./connect/Pool');
const DBMeta = require('./meta_data/DBMeta');
const enums = require('./enums');
const errors = require('./errors');
const sqbNs = require('./sqb_ns');
const extensions = require('./extensions');
const promisePolyfill = require('./helper/promisePolyfill');

promisePolyfill();
module.exports = Object.assign({}, sqbNs);
Object.assign(module.exports, enums);
Object.assign(module.exports, errors);

Object.assign(module.exports, {

  Pool: Pool,
  DBMeta: DBMeta,
  PoolState: Pool.PoolState,
  SelectQuery: SelectQuery,
  InsertQuery: InsertQuery,
  UpdateQuery: UpdateQuery,
  DeleteQuery: DeleteQuery,

  select(...column) {
    return new SelectQuery(...column);
  },

  insert(...column) {
    return new InsertQuery(...column);
  },

  update(table, values) {
    return new UpdateQuery(table, values);
  },

  delete(table) {
    return new DeleteQuery(table);
  },

  /**
   * Creates a new database pool
   * @param {String|Object} config
   * @return {Pool}
   */
  pool(config) {
    return new Pool(config);
  },

  use(extension) {
    extensions.use(extension);
  }

});
