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
const SelectQuery = require('./query/SelectQuery');
const InsertQuery = require('./query/InsertQuery');
const UpdateQuery = require('./query/UpdateQuery');
const DeleteQuery = require('./query/DeleteQuery');
const Pool = require('./connect/Pool');
const DBMeta = require('./meta_data/DBMeta');
const enums = require('./enums');
const sqbNs = require('./sqb_ns');
const extensions = require('./extensions');

module.exports = Object.assign({}, sqbNs);
Object.assign(module.exports, enums);

Object.assign(module.exports, {

  Pool: Pool,
  DBMeta: DBMeta,
  PoolState: Pool.PoolState,
  SelectQuery: SelectQuery,
  InsertQuery: InsertQuery,
  UpdateQuery: UpdateQuery,
  DeleteQuery: DeleteQuery,
  Case: require('./sqlobject/Case'),
  Raw: require('./sqlobject/Raw'),
  Join: require('./sqlobject/Join'),
  TableColumn: require('./sqlobject/TableColumn'),

  select: function(column) {
    const q = Object.create(SelectQuery.prototype);
    SelectQuery.apply(q, arguments);
    return q;
  },

  insert: function(column) {
    const q = Object.create(InsertQuery.prototype);
    InsertQuery.apply(q, arguments);
    return q;
  },

  update: function(table, values) {
    const q = Object.create(UpdateQuery.prototype);
    UpdateQuery.apply(q, arguments);
    return q;
  },

  delete: function(table) {
    const q = Object.create(DeleteQuery.prototype);
    DeleteQuery.apply(q, arguments);
    return q;
  },

  /**
   * Creates a new database pool
   * @param {String|Object} config
   * @return {Pool}
   */
  pool: function(config) {
    return new Pool(config);
  },

  use: function(extension) {
    extensions.use(extension);
  }

});
