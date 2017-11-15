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
const Connection = require('./Connection');
const MetaData = require('./MetaData');
const SelectQuery = require('../query/selectquery');
const InsertQuery = require('../query/insertquery');
const UpdateQuery = require('../query/updatequery');
const DeleteQuery = require('../query/deletequery');
const sqlObjects = require('../sqbexport');
const waterfall = require('putil-waterfall');
const lightningPool = require('lightning-pool');

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
 * @param {int} [config.pool.acquireMaxRetries = 0]
 * @param {int} [config.pool.acquireRetryWait = 2000]
 * @param {int} [config.pool.acquireTimeoutMillis = 0]
 * @param {int} [config.pool.idleTimeoutMillis = 30000]
 * @param {int} [config.pool.max = 10]
 * @param {int} [config.pool.min = 0]
 * @param {int} [config.pool.minIdle = 0]
 * @param {int} [config.pool.maxQueue = 0]
 * @param {int} [config.pool.validation = true]
 * @param {Object} [config.defaults]
 * @param {Boolean} [config.defaults.autoCommit]
 * @param {Boolean} [config.defaults.cursor]
 * @constructor
 */
function DbPool(config) {
  EventEmitter.call(this);
  this._dialect = config.dialect;
  this._user = config.user;
  this._schema = config.schema;
  this._driver = plugins.createDriver(config);
  if (!this._driver)
    throw new ArgumentError('No connection plugin registered for dialect `%s`', config.dialect);
  /* istanbul ignore else */
  if (this._driver.paramType !== undefined)
    config.paramType = this._driver.paramType;
  this.serializer = new Serializer(config);
  this._npool = makePool(this, config && config.pool);
  Object.assign(this, sqlObjects);
  this.defaults = config.defaults || {};
}

DbPool.prototype = {
  get dialect() {
    return this._dialect;
  },

  get isClosed() {
    return this.state === lightningPool.PoolState.STOPPED;
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

  get acquired() {
    return this._npool.acquired;
  },

  get state() {
    return this._npool.state;
  },

  get options() {
    return this._npool.options;
  },

  get metaData() {
    return this._metaData ||
        (this._metaData =
            new MetaData(this, this._driver.metaOperator));
  },

  get PoolState() {
    return lightningPool.Pool.PoolState;
  }

};
Object.setPrototypeOf(DbPool.prototype, EventEmitter.prototype);
DbPool.prototype.constructor = DbPool;

DbPool.prototype.close = function(force, callback) {
  this._npool.stop.apply(this._npool, arguments);
};

DbPool.prototype.start = function() {
  this._npool.start();
};

DbPool.prototype.connect = function(callback) {

  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.connect(cb);
    });
  debug('connect | Creating new connection..');
  // Acquire new connection
  var connection;
  self._npool.acquire(function(err, client) {
    if (err) {
      debug('Error: ' + err.message);
      return callback(err);
    }
    connection = new Connection(self, client);
    connection.on('close', function() {
      self._npool.release(client);
    });
    debug('[%s] connected', connection.sessionId);
    self.emit('connect', connection);
    try {
      callback(null, connection);
    } catch (e) {
      connection.release();
    }
  });
};

DbPool.prototype.execute = function(query, params, options, callback) {
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
    function(next) {
      self.connect(next);
    },
    // poolExecuteQuery
    function(next, _conn) {
      connection = _conn;
      options = options || {};
      options.autoCommit = true;
      connection.execute(query, params, options, next);
    }
  ], function() {
    // Close connection
    /* istanbul ignore else */
    if (connection)
      connection.release();
    callback.apply(null, arguments);
  });
};

DbPool.prototype.test = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.test(cb);
    });
  this.connect(function(err, conn) {
    if (err)
      return callback(err);
    conn.release();
    callback();
  });
};

DbPool.prototype.select = function(column) {
  const query = Object.create(SelectQuery.prototype);
  SelectQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

DbPool.prototype.insert = function(column) {
  const query = Object.create(InsertQuery.prototype);
  InsertQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

DbPool.prototype.update = function(table, values) {
  const query = Object.create(UpdateQuery.prototype);
  UpdateQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

DbPool.prototype.delete = function(table) {
  const query = Object.create(DeleteQuery.prototype);
  DeleteQuery.apply(query, arguments);
  query.pool = this;
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
  options.resetOnReturn = true;

  return lightningPool.createPool({

    create: function(callback) {
      self._driver.createConnection(callback);
    },

    destroy: function(client, callback) {
      client.close(callback);
    },

    reset: function(client, callback) {
      return callback();
      //client.reset(callback);
    },

    validate: function(client, callback) {
      client.test(callback);
    }
  }, options);

}
