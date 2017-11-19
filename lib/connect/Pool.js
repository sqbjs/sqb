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
const debug = require('debug')('sqb:Pool');
const promisify = require('putil-promisify');
const plugins = require('../plugins');
const Serializer = require('../Serializer');
const Connection = require('./Connection');
const MetaData = require('./MetaData');
const SelectQuery = require('../query/SelectQuery');
const InsertQuery = require('../query/InsertQuery');
const UpdateQuery = require('../query/UpdateQuery');
const DeleteQuery = require('../query/DeleteQuery');
const sqlObjects = require('../helper/sqbexport');
const waterfall = require('putil-waterfall');
const lightningPool = require('lightning-pool');

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
 * @param {string} config.password
 * @param {string} config.database
 * @param {string} config.naming
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
  this.defaults = config.defaults || {};
}

Pool.prototype = {
  get dialect() {
    return this._dialect;
  },

  get isClosed() {
    return this.state === Pool.PoolState.STOPPED;
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
  }

};
Object.setPrototypeOf(Pool.prototype, EventEmitter.prototype);
Object.assign(Pool.prototype, sqlObjects);
Pool.prototype.constructor = Pool;

Pool.prototype.close = function(force, callback) {
  this._npool.stop.apply(this._npool, arguments);
};

Pool.prototype.start = function() {
  this._npool.start();
};

Pool.prototype.connect = function(callback) {

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
    self._emitSafe('connect', connection);
    try {
      callback(null, connection);
    } catch (e) {
      connection.release();
    }
  });
};

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

Pool.prototype.test = function(callback) {
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

Pool.prototype.select = function(column) {
  const query = Object.create(SelectQuery.prototype);
  SelectQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

Pool.prototype.insert = function(column) {
  const query = Object.create(InsertQuery.prototype);
  InsertQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

Pool.prototype.update = function(table, values) {
  const query = Object.create(UpdateQuery.prototype);
  UpdateQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

Pool.prototype.delete = function(table) {
  const query = Object.create(DeleteQuery.prototype);
  DeleteQuery.apply(query, arguments);
  query.pool = this;
  return query;
};

Pool.PoolState = lightningPool.PoolState;

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

/**
 * Factory to create new pools for a given Pool
 * @param {Pool} self
 * @param {Object} options
 * @return {Object}
 */
function makePool(self, options) {

  options = options || {};
  options.validation = options.validation == null ? false : options.validation;
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
    },

    validate: function(client, callback) {
      client.test(callback);
    }
  }, options);

}