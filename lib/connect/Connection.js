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
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('sqb:Connection');
const PreparedQuery = require('./PreparedQuery');
const sqlObjects = require('../sqb_ns');
const merge = require('putil-merge');

/**
 *
 * @class
 */
class Connection extends EventEmitter {
  /**
   *
   * @param {Pool} pool
   * @param {Object} client
   * @param {Object} options
   * @param {Boolean} [options.autoCommit]
   * @constructor
   */
  constructor(pool, client, options) {
    super();
    this._pool = pool;
    this._sessionId = client.sessionId;
    this._client = client;
    this._refCount = 1;
    this._autoCommit = options.autoCommit;
    this.on('error', (e) => {
      if (process.env.DEBUG)
        debug('[%s] error | %o', this.sessionId, e);
    });
  }

  /**
   * Returns true if connection is released
   *
   * @return {Boolean}
   */
  get isClosed() {
    return !this._client;
  }

  /**
   * Returns session id
   *
   * @return {String|Integer}
   */
  get sessionId() {
    return this._sessionId;
  }

  /**
   * Returns reference counter value
   *
   * @return {number}
   */
  get referenceCount() {
    return this._refCount;
  }

  /**
   * Returns the Pool instance that connection owned by
   *
   * @return {Pool}
   */
  get pool() {
    return this._pool;
  }

  /**
   * Returns connection is in auto commit mode or not
   *
   * @return {Boolean}
   */
  get autoCommit() {
    return this._autoCommit;
  }

  /**
   * This call Executes a query
   *
   * @param {String|Query} query
   * @param {Object} [options]
   * @return {Promise}
   */
  execute(query, options) {
    /* Prepare query */
    try {
      const prepared = new PreparedQuery(this, query, options);
      this.emitSafe('execute', prepared.query, prepared.options);
      return prepared.execute();
    } catch (e) {
      this.emitSafe('error', e);
      return Promise.reject(e);
    }
  }

  /**
   * Increases internal reference counter of connection instance
   *
   * @public
   */
  acquire() {
    this._refCount++;
    debug('[%s] acquired | refCount: %s', this.sessionId, this._refCount);
  }

  /**
   * Decreases the internal reference counter.
   * When reference count is 0, connection returns to the pool.
   * Returns true if connection released.
   *
   * @return {Boolean}
   * @public
   */
  release() {
    if (this.isClosed || !this._refCount)
      throw new Error('Connection closed');
    const ref = --this._refCount;
    if (!ref) {
      debug('[%s] close', this.sessionId);
      this._client = null;
      this.emitSafe('closing');
      return true;
    } else
      debug('[%s] release | refCount: %s', this.sessionId, ref);
    return false;
  }

  /**
   * Returns values of properties that connection adapter exposes.
   *
   * @param {String} param
   * @return {*}
   */
  get(param) {
    return this._client && (typeof this._client.get === 'function') &&
        this._client.get(param);
  }

  /**
   * Starts a transaction
   *
   * @return {Promise}
   * @public
   */
  startTransaction() {
    if (this.isClosed)
      return Promise.reject(new Error('Connection closed'));
    return this._client.startTransaction().then(() => {
      debug('[%s] start transaction', this.sessionId);
      this.emitSafe('start-transaction');
    }).catch(e => {
      this.emitSafe('error', e);
      throw e;
    });
  }

  /**
   * Commits the current transaction in progress on the connection.
   *
   * @return {Promise}
   * @public
   */
  commit() {
    if (this.isClosed)
      return Promise.reject(new Error('Connection closed'));
    return this._client.commit().then(() => {
      debug('[%s] commit', this.sessionId);
      this.emitSafe('commit');
    }).catch(e => {
      this.emitSafe('error', e);
      throw e;
    });
  }

  /**
   * Rolls back the current transaction in progress on the connection.
   *
   * @return {Promise}
   * @public
   */
  rollback() {
    if (this.isClosed)
      return Promise.reject(new Error('Connection closed'));
    return this._client.rollback().then(() => {
      debug('[%s] rollback', this.sessionId);
      this.emitSafe('rollback');
    }).catch(e => {
      this.emitSafe('error', e);
      throw e;
    });
  }

  /**
   * This call tests the connection.
   * @return {Promise}
   */
  test() {
    return this._client.test().catch(e => {
      this.emitSafe('error', e);
      throw e;
    });
  }

  /**
   * Creates an executable SelectQuery associated with this connection.
   * @param {...*} column
   * @return {SelectQuery}
   */
  select(...column) {
    const query = this.pool.select(...column);
    query._dbobj = this;
    return query;
  }

  /**
   * Creates an executable InsertQuery associated with this connection.
   * @param {string|Raw} tableName
   * @param {Object} values
   * @return {InsertQuery}
   */
  insert(tableName, values) {
    const query = this.pool.insert(tableName, values);
    query._dbobj = this;
    return query;
  }

  /**
   * Creates an executable UpdateQuery associated with this connection.
   * @param {String} tableName
   * @param {Object} values
   * @return {UpdateQuery}
   */
  update(tableName, values) {
    const query = this.pool.update(tableName, values);
    query._dbobj = this;
    return query;
  }

  /**
   * Creates an executable DeleteQuery associated with this connection.
   * @param {String} tableName
   * @return {DeleteQuery}
   */
  delete(tableName) {
    const query = this.pool.delete(tableName);
    query._dbobj = this;
    return query;
  }

  toString() {
    return '[object ' + Object.getPrototypeOf(this).constructor.name + '(' +
        this.sessionId + ')]';
  }

  inspect() {
    return this.toString();
  }

  /**
   *
   */
  emitSafe(...args) {
    try {
      this.emit(...args);
    } catch (ignored) {
      debug('emit-error', ignored);
    }
  }

}

merge.descriptor(Connection.prototype, sqlObjects);

/**
 * Expose `Connection`.
 */
module.exports = Connection;


