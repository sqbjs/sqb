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
const {ArgumentError} = require('errorex');
const debug = require('debug')('sqb:Pool');
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
   * @param {Integer} [config.pool.acquireMaxRetries = 0]
   * @param {Integer} [config.pool.acquireRetryWait = 2000]
   * @param {Integer} [config.pool.acquireTimeoutMillis = 0]
   * @param {Integer} [config.pool.idleTimeoutMillis = 30000]
   * @param {Integer} [config.pool.max = 10]
   * @param {Integer} [config.pool.maxQueue = 1000]
   * @param {Integer} [config.pool.min = 0]
   * @param {Integer} [config.pool.minIdle = 0]
   * @param {Integer} [config.pool.validation = false]
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

    /* Create object pool */
    const factory = {
      create: () => adapter.createConnection(),
      destroy: (client) => {
        return client.close().then(() => {
          if (client.connection)
            client.connection.emitSafe('close');
        });
      },
      reset: (client) => client.rollback,
      validate: (client) => {
        return client.test();
      }
    };
    const poolOptions = config.pool || {};
    poolOptions.resetOnReturn = true;
    super(factory, poolOptions);
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
   * @param {Object} [options]
   * @param {Function} [sessionFn]
   * @return {Promise}
   */
  acquire(options, sessionFn) {
    debug('acquire');

    if (typeof options === 'function') {
      sessionFn = options;
      options = null;
    }
    options = options || {};

    if (sessionFn && typeof sessionFn !== 'function')
      return Promise.reject(new ArgumentError('`sessionFn` argument can be only a function'));

    const result = new Promise((resolve, reject) => {
      // Acquire new client from driver
      super.acquire((err, client) => {
        if (err)
          return reject(err);
        // Create new connection
        const connection = new Connection(this, client,
            {
              autoCommit: options.autoCommit != null ? options.autoCommit :
                  (this.config.defaults && this.config.defaults.autoCommit)
            });
        connection.once('closing', () => {
          super.release(client).then(() => connection.emitSafe('close'));
        });
        debug('[%s] acquired', connection.sessionId);
        this._emitSafe('acquire', connection);
        resolve(connection);
      });
    });
    if (sessionFn) {
      return result
          .then(conn => Promise.try(() => sessionFn(conn))
              .then((v) => conn.commit().then(() => v))
              .catch((e) => conn.rollback().finally(() => {
                throw e;
              }))
              .finally(() => conn.release()));
    }
    return result;
  }

  // noinspection JSCheckFunctionSignatures
  /**
   * Shuts down the pool and destroys all resources.
   *
   * @param {Boolean} [force]
   * @return {Promise}
   * @override
   */
  close(force) {
    return new Promise((resolve, reject) => {
      super.close(force, (err) => {
        if (err) {
          this._emitSafe('error', err);
          return reject(err);
        }
        debug('Pool shut down');
        this._emitSafe('close');
        resolve();
      });
    });
  }

  /**
   * This call acquires a connection from the pool and
   * executes the query with that connection.
   * After execution it commits the transaction and releases connection.
   * On error, it rollbacks the transaction.
   *
   * @param {String|Object|Query} query
   * @param {String} [query.sql]
   * @param {Object|Array} [query.values]
   * @param {Object} [query.returningParams]
   * @param {Array|Object} [params]
   * @param {Object} [options]
   * @return {Promise}
   */
  execute(query, params, options) {
    return this.acquire(conn =>
        conn.execute(query, params, options)
    );
  }

  /**
   * This call tests the pool.
   * @return {Promise}
   */
  test() {
    return this.acquire().then((conn) => {
      conn.test().finally(() => conn.release());
    });
  }

  /**
   * Creates an executable SelectQuery associated with this pool.
   * @param {...*} column
   * @return {SelectQuery}
   */
  select(...column) {
    const query = new SelectQuery(...column);
    query._dbobj = this;
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
    query._dbobj = this;
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
    query._dbobj = this;
    return query;
  }

  /**
   * Creates an executable DeleteQuery associated with this pool.
   * @param {String} tableName
   * @return {DeleteQuery}
   */
  delete(tableName) {
    const query = new DeleteQuery(tableName);
    query._dbobj = this;
    return query;
  }

  /**
   *
   * @return {String}
   * @override
   */
  toString() {
    return '[object ' + Object.getPrototypeOf(this).constructor.name + '(' +
        this.dialect + ')]';
  }

  /**
   *
   * @return {String}
   * @override
   */
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
Pool.PoolState = LPool.PoolState;

/**
 * Expose `Pool`.
 */

module.exports = Pool;
