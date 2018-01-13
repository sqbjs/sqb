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
const ArgumentError = require('errorex').ArgumentError;
const debug = require('debug')('sqb:Pool');
const promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');
const defineConst = require('putil-defineconst');
const LPool = require('lightning-pool').Pool;
const extensions = require('../extensions');
const Connection = require('./Connection');
const SelectQuery = require('../query/SelectQuery');
const InsertQuery = require('../query/InsertQuery');
const UpdateQuery = require('../query/UpdateQuery');
const DeleteQuery = require('../query/DeleteQuery');
const sqlObjects = require('../sqb_ns');

/**
 * Expose `Pool`.
 */

module.exports = Pool;

/**
 * Create a new database pool
 *
 * @param {String|Object} config
 * @param {string} config.dialect
 * @param {string} config.user
 * @param {string} [config.schema]
 * @param {Object} [config.pool]
 * @param {int} [config.pool.acquireMaxRetries = 0]
 * @param {int} [config.pool.acquireRetryWait = 2000]
 * @param {int} [config.pool.acquireTimeoutMillis = 0]
 * @param {int} [config.pool.idleTimeoutMillis = 30000]
 * @param {int} [config.pool.max = 10]
 * @param {int} [config.pool.maxQueue = 1000]
 * @param {int} [config.pool.min = 0]
 * @param {int} [config.pool.minIdle = 0]
 * @param {int} [config.pool.validation = false]
 * @param {Object} [config.defaults]
 * @param {Boolean} [config.defaults.autoCommit]
 * @param {Boolean} [config.defaults.cursor]
 * @param {Boolean} [config.defaults.objectRows]
 * @param {String} [config.defaults.naming]
 *
 * @constructor
 */
function Pool(config) {
  if (!(config && typeof config === 'object'))
    throw new ArgumentError('Pool configuration object required');

  const adapter = extensions.createAdapter(config);
  if (!adapter)
    throw new ArgumentError('No connection adapter registered for dialect `%s`', config.dialect);

  config.defaults = config.defaults || {};
  this.config = Object.assign({}, config);
  delete this.config.pool;
  /* istanbul ignore else */
  if (adapter.paramType !== undefined)
    this.config.paramType = adapter.paramType;

  /* Lightning pool arguments */
  const options = config.pool || {};
  options.resetOnReturn = options.resetOnReturn ||
      options.resetOnReturn === undefined;
  this._factory = {
    create: function(callback) {
      adapter.createConnection(callback);
    },
    destroy: function(client, callback) {
      client.close(callback);
    },
    reset: function(client, callback) {
      client.rollback(callback);
    },
    validate: function(client, callback) {
      client.test(callback);
    }
  };
  LPool.call(this, this._factory, options);

  defineConst(this, {
    dialect: config.dialect,
    adapter: adapter
  }, true);
}

Pool.prototype = {
  get isClosed() {
    return this.state === Pool.PoolState.CLOSED;
  }
};

Object.setPrototypeOf(Pool.prototype, LPool.prototype);
Object.assign(Pool.prototype, sqlObjects);
Pool.prototype.constructor = Pool;

Pool.prototype.acquire = null;

/**
 * This method obtains a connection from the connection pool.
 * @param {Function} callback
 * @return {Promise|undefined}
 */
Pool.prototype.connect = function(callback) {

  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.connect(cb);
    });
  debug('connect');
  // Acquire new connection
  var connection;
  LPool.prototype.acquire.call(self, function(err, client) {
    if (err) {
      debug('Error: ' + err.message);
      return callback(err);
    }
    connection = new Connection(self, client);
    connection.on('close', function() {
      LPool.prototype.release.call(self, client);
    });
    debug('[%s] connected', connection.sessionId);
    self._emitSafe('connect', connection);
    try {
      callback(null, connection);
    } catch (e) {
      connection.release();
    }
  });
};

/**
 * This call acquires a connection, executes the query and releases connection immediately.
 * @param {String|Query} query
 * @param {Array|Object} [params]
 * @param {Object} [options]
 * @param {Function} callback
 * @return {Promise|undefined}
 */
Pool.prototype.execute = function(query, params, options, callback) {
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
      connection.on('execute', function(sql, values, options) {
        self._emitSafe('execute', sql, values, options);
      });
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

/**
 * This call tests the pool.
 * @param {Function} callback
 * @return {Promise|undefined}
 */
Pool.prototype.test = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.test(cb);
    });
  this.connect(function(err, conn) {
    if (err)
      return callback(err);
    conn.test(function(err) {
      conn.release();
      callback(err);
    });
  });
};

/**
 * Creates an executable SelectQuery associated with this pool.
 * @param {...*} column
 * @return {SelectQuery}
 */
Pool.prototype.select = function(column) {
  const query = Object.create(SelectQuery.prototype);
  SelectQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

/**
 * Creates an executable InsertQuery associated with this pool.
 * @param {...String|TableColumn} column
 * @return {InsertQuery}
 */
Pool.prototype.insert = function(column) {
  const query = Object.create(InsertQuery.prototype);
  InsertQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

/**
 * Creates an executable UpdateQuery associated with this pool.
 * @param {String} table
 * @return {UpdateQuery}
 */
Pool.prototype.update = function(table) {
  const query = Object.create(UpdateQuery.prototype);
  UpdateQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

/**
 * Creates an executable DeleteQuery associated with this pool.
 * @param {String} table
 * @return {DeleteQuery}
 */
Pool.prototype.delete = function(table) {
  const query = Object.create(DeleteQuery.prototype);
  DeleteQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

Pool.PoolState = LPool.PoolState;

/*
 * Private Methods
 */

Pool.prototype._emitSafe = function() {
  try {
    this.emit.apply(this, arguments);
  } catch (e) {
    //
  }
};

