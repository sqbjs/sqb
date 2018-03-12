/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const ArgumentError = require('errorex').ArgumentError;
const debug = require('debug')('sqb:Pool');
const promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');
const LPool = require('lightning-pool').Pool;
const extensions = require('../extensions');
const Connection = require('./Connection');
const SelectQuery = require('../query/SelectQuery');
const InsertQuery = require('../query/InsertQuery');
const UpdateQuery = require('../query/UpdateQuery');
const DeleteQuery = require('../query/DeleteQuery');
const sqlObjects = require('../sqb_ns');

/**
 *
 * @class
 */
class Pool extends LPool {
  /**
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
   * @constructor
   */
  constructor(config) {
    if (!(config && typeof config === 'object'))
      throw new ArgumentError('Pool configuration object required');

    const adapter = extensions.createAdapter(config);
    if (!adapter)
      throw new ArgumentError('No connection adapter registered for dialect `%s`', config.dialect);
    config.defaults = config.defaults || {};
    const cfg = Object.assign({}, config);
    delete cfg.pool;
    /* istanbul ignore else */
    if (adapter.paramType !== undefined)
      cfg.paramType = adapter.paramType;

    /* Lightning pool arguments */
    const options = config.pool || {};
    options.resetOnReturn = options.resetOnReturn ||
        options.resetOnReturn === undefined;
    const factory = {
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
    super(factory, options);
    this.config = cfg;
  }

  /**
   * Return dialect
   *
   * @return {string}
   */
  get dialect() {
    return this.config.dialect;
  }

  /**
   * Returns true if pool is closed
   *
   * @return {boolean}
   */
  get isClosed() {
    return this.state === Pool.PoolState.CLOSED;
  }

  /**
   * This method obtains a connection from the connection pool.
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  connect(callback) {

    if (!callback)
      return promisify.fromCallback((cb) => this.connect(cb));

    debug('connect');
    // Acquire new connection
    let connection;
    super.acquire((err, client) => {
      if (err) {
        debug('Error: ' + err.message);
        return callback(err);
      }
      connection = new Connection(this, client);
      connection.on('close', () => {
        super.release(client);
      });
      debug('[%s] connected', connection.sessionId);
      this._emitSafe('connect', connection);
      try {
        const o = callback(null, connection);
        if (promisify.isPromise(o))
          o.then(() => {
            connection.commit(() => {
              connection.release();
            });
          }, () => {
            connection.rollback(() => {
              connection.release();
            });
          });
      } catch (e) {
        connection.rollback(() => {
          connection.release();
        });
      }
    });
  }

  /**
   * This call acquires a connection, executes the query and releases connection immediately.
   * @param {String|Query} query
   * @param {Array|Object} [params]
   * @param {Object} [options]
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  execute(query, params, options, callback) {
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
      return promisify.fromCallback((cb) => this.execute(query, params, options, cb));

    let connection;
    waterfall([
      // Get connection from pool
      (next) => this.connect(next),
      // execute query
      (next, _conn) => {
        connection = _conn;
        options = options || {};
        options.autoCommit = true;
        connection.on('execute', (sql, values, options) => {
          this._emitSafe('execute', sql, values, options);
        });
        connection.execute(query, params, options, next);
      }
    ], (...args) => {
      // Close connection
      /* istanbul ignore else */
      if (connection)
        connection.release();
      callback(...args);
    });
  }

  /**
   * This call tests the pool.
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  test(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.test(cb));

    this.connect((err, conn) => {
      if (err)
        return callback(err);
      conn.test((err) => {
        conn.release();
        callback(err);
      });
    });
  }

  /**
   * Creates an executable SelectQuery associated with this pool.
   * @param {...*} column
   * @return {SelectQuery}
   */
  select(...column) {
    const query = new SelectQuery(...column);
    query.pool = this;
    return query;
  }

  /**
   * Creates an executable InsertQuery associated with this pool.
   * @param {string|Raw} tableName
   * @param {Object} values
   * @return {InsertQuery}
   */
  insert(tableName, values) {
    const query = new InsertQuery(tableName, values);
    query.pool = this;
    return query;
  }

  /**
   * Creates an executable UpdateQuery associated with this pool.
   * @param {String} tableName
   * @param {Object} values
   * @return {UpdateQuery}
   */
  update(tableName, values) {
    const query = new UpdateQuery(tableName, values);
    query.pool = this;
    return query;
  }

  /**
   * Creates an executable DeleteQuery associated with this pool.
   * @param {String} tableName
   * @return {DeleteQuery}
   */
  delete(tableName) {
    const query = new DeleteQuery(tableName);
    query.pool = this;
    return query;
  }

  toString() {
    return '[object Pool(' + this.dialect + ')]';
  }

  inspect() {
    return this.toString();
  }

  /**
   *
   * @private
   */
  _emitSafe(...args) {
    try {
      this.emit(...args);
    } catch (ignored) {
      //
    }
  }

}

Object.assign(Pool.prototype, sqlObjects);
Pool.prototype.acquire = null;
Pool.PoolState = LPool.PoolState;

/**
 * Expose `Pool`.
 */

module.exports = Pool;
