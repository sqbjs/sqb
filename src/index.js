/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const SqlObject = require('./sqlobjects/sqlobject');
const Select = require('./statements/select');
const Insert = require('./statements/insert');
const Update = require('./statements/update');
const Delete = require('./statements/delete');
const Raw = require('./sqlobjects/raw');
const Column = require('./sqlobjects/column');
const Join = require('./sqlobjects/join');
const Condition = require('./sqlobjects/condition');
const ConditionGroup = require('./sqlobjects/conditiongroup');
const Case = require('./sqlobjects/case');
const Serializer = require('./serializer');
const DbPool = require('./connect/pool');
const Connection = require('./connect/connection');
const MetaData = require('./connect/metadata');
const ResultSet = require('./connect/resultset');
const {ResultCache} = require('./connect/resultcache');

const sqlObjects = require('./helpers/sqbexport');
const Promisify = require('./helpers/promisify');
const StringBuilder = require('./helpers/clausebuilder');

//noinspection JSUnusedGlobalSymbols
Object.assign(sqlObjects, {

  Serializer,
  DbPool,
  Connection,
  MetaData,
  ResultSet,
  ResultCache,
  StringBuilder,

  SqlObject,
  Select,
  Insert,
  Update,
  Delete,
  Raw,
  Column,
  Join,
  Condition,
  ConditionGroup,
  Case,

  /**
   * Creates a new serializer
   * @param {Object} config
   * @return {Serializer}
   */
  serializer: function(config) {
    return Serializer.create(config);
  },

  /**
   * Creates a new database pool
   * @param {Object} config
   * @return {DbPool}
   */
  pool: function(config) {
    return DbPool.create(config);
  },

  /**
   * Assigns a custom Promise library
   * @param {constructor} value
   */
  set promiseClass(value) {
    Promisify.Promise = value || Promise;
  }

});

module.exports = sqlObjects;
