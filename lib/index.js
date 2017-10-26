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
const SqlObject = require('./sqlobjects/sqlobject');
const SelectQuery = require('./query/selectquery');
const InsertQuery = require('./query/insertquery');
const UpdateQuery = require('./query/updatequery');
const DeleteQuery = require('./query/deletequery');
const Raw = require('./sqlobjects/raw');
const Column = require('./sqlobjects/column');
const Join = require('./sqlobjects/join');
const Condition = require('./sqlobjects/condition');
const ConditionGroup = require('./sqlobjects/conditiongroup');
const Case = require('./sqlobjects/case');
const Serializer = require('./serializer');
const DbPool = require('./connect/pool');
const Connection = require('./connect/connection');
const DatasetCache = require('./connect/datasetcache').DatasetCache;
const DatasetStream = require('./connect/datasetstream');
const types = require('./types');
const sqbexport = require('./sqbexport');
const plugins = require('./plugins');

module.exports = Object.assign({}, sqbexport);
Object.assign(module.exports, types);

Object.assign(module.exports, {

  Serializer: Serializer,
  DbPool: DbPool,
  Connection: Connection,
  DatasetCache: DatasetCache,
  DatasetStream: DatasetStream,

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
   * @return {DbPool}
   */
  pool: function(config) {
    return new DbPool(config);
  },

  use: function(plugin) {
    plugins.use(plugin);
  }

});
