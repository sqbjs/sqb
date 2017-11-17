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
const SqlObject = require('./sqlobject/SqlObject');
const SelectQuery = require('./query/SelectQuery');
const InsertQuery = require('./query/InsertQuery');
const UpdateQuery = require('./query/UpdateQuery');
const DeleteQuery = require('./query/DeleteQuery');
const Raw = require('./sqlobject/Raw');
const Column = require('./sqlobject/Column');
const Join = require('./sqlobject/Join');
const Condition = require('./sqlobject/Condition');
const ConditionGroup = require('./sqlobject/ConditionGroup');
const Case = require('./sqlobject/Case');
const Serializer = require('./Serializer');
const Pool = require('./connect/Pool');
const types = require('./types');
const sqbexport = require('./helper/sqbexport');
const plugins = require('./plugins');

module.exports = Object.assign({}, sqbexport);
Object.assign(module.exports, types);

Object.assign(module.exports, {

  Serializer: Serializer,
  Pool: Pool,
  PoolState: Pool.PoolState,

  SqlObject: SqlObject,
  SelectQuery: SelectQuery,
  InsertQuery: InsertQuery,
  UpdateQuery: UpdateQuery,
  DeleteQuery: DeleteQuery,
  Raw: Raw,
  Column: Column,
  Join: Join,
  Condition: Condition,
  ConditionGroup: ConditionGroup,
  Case: Case,

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
   * Creates a new serializer
   * @param {Object} config
   * @return {Serializer}
   */
  serializer: function(config) {
    if (typeof config === 'object' && config.isSerializer)
      return config;
    return new Serializer(config);
  },

  /**
   * Creates a new database pool
   * @param {String|Object} config
   * @return {Pool}
   */
  pool: function(config) {
    return new Pool(config);
  },

  use: function(plugin) {
    plugins.use(plugin);
  }

});
