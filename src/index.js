/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const SqlObject = require('./interface/sqlobject');
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
const DbPool = require('./interface/pool');
const Connection = require('./interface/connection');
const MetaData = require('./interface/metadata');
const RowSet = require('./interface/rowset');

const sqlObjects = require('./interface/sqbexport');
const Promisify = require('./helpers/promisify');

//noinspection JSUnusedGlobalSymbols
Object.assign(sqlObjects, {

  Serializer,
  DbPool,
  Connection,
  MetaData,
  RowSet,

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
    Promisify.Promise = value;
  }

});

module.exports = sqlObjects;
