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
const promisify = require('putil-promisify');
const plugins = require('../plugins');
const Serializer = require('../serializer');
const Connection = require('./connection');
const DatabaseMetaData = require('./metadata');
const SelectQuery = require('../query/selectquery');
const InsertQuery = require('../query/insertquery');
const UpdateQuery = require('../query/updatequery');
const DeleteQuery = require('../query/deletequery');
const sqlObjects = require('../sqbexport');
const waterfall = require('putil-waterfall');
const genericPool = require('generic-pool');

/**
 * Expose `DbPool`.
 */

module.exports = DbPool;

/**
 * Create a new database pool
 *
 * @param {String|Object} config
 * @param {string} config.dialect
 * @param {string} config.user
 * @param {string} config.password
 * @param {string} config.database
 * @param {string} config.naming
 * @param {Object} [config.pool]
 * @param {int} [config.pool.max=10]
 * @param {int} [config.pool.min]
 * @param {int} [config.pool.idleTimeoutMillis=60000]
 * @param {int} [config.pool.maxQueue]
 * @param {int} [config.pool.acquireTimeoutMillis]
 * @param {Object} [config.defaults]
 * @param {Boolean} [config.defaults.autoCommit]
 * @param {Boolean} [config.defaults.dataset]
 * @param {Boolean} [config.defaults.metaData]
 * @constructor
 */
function DbPool(config) {
  EventEmitter.call(this);
  this._dialect = config.dialect;
  this._user = config.user;
  this._schema = config.schema;
  this._connector = plugins.createConnector(config);
  if (!this._connector)
    throw new ArgumentError('No connection plugin registered for dialect `%s`', config.dialect);
  this.serializer = new Serializer(config);
  this._npool = makePool(this, config && config.pool);
  Object.assign(this, sqlObjects);
  this._metaData = new DatabaseMetaData(this);
  this.defaults = config.defaults || {};
}

const proto = DbPool.prototype = {
  get dialect() {
    return this._dialect;
  },

  get isClosed() {
    return !this._started;
  },

  get schema() {
    return this._schema;
  },

  get user() {
    return this._user;
  },

  get size() {
    return this._npool.size;
  },

  get available() {
    return this._npool.available;
  },

  get pending() {
    return this._npool.pending;
  },

  get borrowed() {
    return this._npool.borrowed;
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

proto.close = function(callback) {
  if (!callback)
    return promisify.fromCallback(this.close.bind(this));
  const self = this;
  if (!self._started)
    return callback();
  self._npool.drain()
      .then(function() {
        self._started = false;
        self._npool.clear();
        callback();
      }, function(e) {
        callback(e);
      });
};

proto.start = function() {
  this._npool.start();
  this._started = true;
};

proto.connect = function(callback) {

  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.connect(cb);
    });
  const self = this;
  if (process.env.DEBUG)
    debug('connect | Creating new connection..');

  // Start pool
  self.start();
  // Acquire new connection
  var connection;
  self._npool.acquire()
      .then(function(nconn) {
        connection = new Connection(self, nconn);
        connection.on('close', function() {
          self._npool.release(connection._nconn);
          connection._nconn = null;
        });
        if (process.env.DEBUG)
          debug('[%s] connected', connection.sessionId);
        return callback(undefined, connection);
      })
      .catch(function(err) {
        if (connection)
          connection.close();
        if (process.env.DEBUG)
          debug('Error: ' + err.message);
      });
};

proto.execute = function(query, params, options, callback) {
  const self = this;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof params === 'function') {
    callback = params;
    options = undefined;
    params = undefined;
  }
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.execute(query, params, options, cb);
    });
  var connection;
  waterfall([
    // Get connection from pool
    function poolExecuteStep1(next) {
      self.connect(next);
    },
    // poolExecuteQuery
    function poolExecuteStep2(next, _conn) {
      connection = _conn;
      options = options || {};
      options.autoCommit = true;
      connection.execute(query, params, options, next);
    }
  ], function poolExecuteDone() {
    // Close connection
    if (connection)
      connection.close();
    callback.apply(null, arguments);
  });
};

proto.test = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.test(cb);
    });
  this.connect(function(err, conn) {
    if (conn)
      conn.close();
    callback(err);
  });
};

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

/**
 * Factory to create new pools for a given DbPool
 * @param {DbPool} self
 * @param {Object} options
 * @return {Object}
 */
function makePool(self, options) {

  options = options || {};

  return genericPool.createPool({

    create: function() {
      return new promisify.Promise(function(resolve, reject) {
        self._connector(function(err, nconn) {
          if (err)
            return reject(err);
          resolve(nconn);
        });
      });
    },

    destroy: function(nconn) {
      return new promisify.Promise(function(resolve, reject) {
        nconn.close(function(err) {
          if (err)
            return reject(err);
          resolve();
        });
      });
    },

    validate: function(connection) {
      return new promisify.Promise(function(resolve, reject) {
        connection.test(function(err) {
          if (err)
            return reject(err);
          resolve();
        });
      });
    }
  }, {
    max: options.max || 10,
    min: options.min || 0,
    idleTimeoutMillis: options.idleTimeoutMillis || 60000,
    maxWaitingClients: options.maxQueue,
    acquireTimeoutMillis: options.acquireTimeoutMillis,
    testOnBorrow: options.validate,
    autostart: false,
    Promise: promisify.Promise
  });
}
