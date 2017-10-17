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
const EventEmitter = require('events').EventEmitter;
const ArgumentError = require('errorex').ArgumentError;
const debug = require('debug')('sqb:DbPool');
const Promisify = require('putil-promisify');
const plugins = require('../plugins');
const Serializer = require('../serializer');
const Connection = require('./connection');
const DatabaseMetaData = require('./metadata');
const SelectQuery = require('../query/selectquery');
const InsertQuery = require('../query/insertquery');
const UpdateQuery = require('../query/updatequery');
const DeleteQuery = require('../query/deletequery');
const sqlObjects = require('../defs');

/**
 * Expose `DbPool`.
 */

module.exports = DbPool;

/**
 * @constructor
 * @param {String|Object} config
 * @param {string} config.dialect
 * @param {string} config.user
 * @param {string} config.password
 * @param {string} config.connectString
 * @param {string} config.naming
 * @param {Object} config.pool
 * @param {int} config.pool.max
 * @param {int} config.pool.min
 * @param {int} config.pool.increment
 * @param {int} config.pool.timeout
 */
function DbPool(config) {
  EventEmitter.call(this);

  config = typeof config === 'object' ?
      Object.assign({}, config) : {dialect: config};
  const pool = config.pool = config.pool || {};
  pool.max = pool.max || 10;
  pool.min = pool.min || 0;
  pool.increment = pool.increment || 1;
  pool.idleTimeout = pool.idleTimeout || 60;
  const self = this;
  self.nastedPool = plugins.createPool(config);
  if (!self.nastedPool)
    throw new ArgumentError('No connection plugin registered for dialect `%s`', config.dialect);
  self.serializer = new Serializer(config);
  Object.defineProperty(this, 'defaults',
      {value: config.defaults || {}, writable: false, configurable: false});
  delete config.defaults;
  Object.defineProperty(this, 'config',
      {value: Object.freeze(config), writable: false, configurable: false});
  Object.assign(this, sqlObjects);
  this._metaData = new DatabaseMetaData(this);
}

const proto = DbPool.prototype = {
  get dialect() {
    return this.config.dialect;
  },

  get isClosed() {
    return this._closed;
  },

  //noinspection JSUnusedGlobalSymbols
  get user() {
    return this.config.user;
  },

  //noinspection JSUnusedGlobalSymbols
  get schema() {
    return this.config.schema;
  },

  /**
   *
   * @return {DatabaseMetaData}
   * @abstract
   */
  get metaData() {
    return this._metaData;
  }

};
Object.setPrototypeOf(proto, EventEmitter.prototype);
proto.constructor = DbPool;

proto.select = function(column) {
  const query = Object.create(SelectQuery.prototype);
  SelectQuery.apply(query, arguments);
  query.dbpool = this;
  return query;
};

proto.insert = function(column) {
  const query = Object.create(InsertQuery.prototype);
  InsertQuery.apply(query, arguments);
  query.dbpool = this;
  return query;
};

proto.update = function(table, values) {
  const query = Object.create(UpdateQuery.prototype);
  UpdateQuery.apply(query, arguments);
  query.dbpool = this;
  return query;
};

proto.delete = function(table) {
  const query = Object.create(DeleteQuery.prototype);
  DeleteQuery.apply(query, arguments);
  query.dbpool = this;
  return query;
};

proto.connect = function(callback) {
  if (!callback)
    return Promisify.fromCallback(this.connect.bind(this));

  const self = this;
  if (process.env.DEBUG)
    debug('connect | Creating new connection..');

  self.nastedPool.connect(function(error, nconn) {
    if (process.env.DEBUG) {
      if (error)
        debug('Error: ' + error.message);
      else
        debug('[%s] connected', nconn.sessionId);
    }
    var connection;
    if (nconn) {
      connection = new Connection(self, nconn);
      connection.acquire();
    }
    try {
      const o = callback(error, connection);
      if (Promisify.isPromise(o))
        o.catch(function() {
          if (connection)
            connection.rollback(function() {
              connection.close();
            });
        });
    } catch (e) {
      if (connection)
        connection.rollback(function() {
          connection.close(function() {});
        });
      throw e;
    }
  });
};

proto.close = function(callback) {
  if (!callback)
    return Promisify.fromCallback(this.close.bind(this));
  const self = this;
  this.nastedPool.close(function(err) {
    if (!err)
      self._closed = true;
    callback(err);
  });
};

proto.test = function(callback) {
  const self = this;
  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.test(cb);
    });
  this.select('1').execute(function(err) {
    callback(err);
  });
};
