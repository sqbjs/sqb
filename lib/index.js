/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
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
const {DatasetCache} = require('./connect/datasetcache');
const DatasetStream = require('./connect/datasetstream');

const sqbexport = require('./defs');
const plugins = require('./plugins');

module.exports = {};
Object.assign(module.exports, sqbexport);

//noinspection JSUnusedGlobalSymbols
Object.assign(module.exports, {

  Serializer,
  DbPool,
  Connection,
  DatasetCache,
  DatasetStream,

  SqlObject,
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
  Raw,
  Column,
  Join,
  Condition,
  ConditionGroup,
  Case,

  select(...columns) {
    return new SelectQuery(...columns);
  },

  insert(...columns) {
    return new InsertQuery(...columns);
  },

  update(table, values) {
    return new UpdateQuery(table, values);
  },

  delete(table) {
    return new DeleteQuery(table);
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

  use(plugin) {
    plugins.use(plugin);
  }

});


