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
const promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');
const Cursor = require('./Cursor');
const Rowset = require('./Rowset');
const FieldCollection = require('./FieldCollection');
const Row = require('./Row');
const normalizeRows = require('../helper/normalizeRows');
const SqlError = require('../error/SqlError');
const sqlObjects = require('../sqb_ns');

/**
 *
 * @class
 */
class Connection extends EventEmitter {
  /**
   *
   * @param {Pool} pool
   * @param {Object} client
   * @constructor
   */
  constructor(pool, client) {
    super();
    this._pool = pool;
    this._sessionId = client.sessionId;
    this._client = client;
    this._refCount = 1;
  }

  /**
   * Returns true if connection is released
   *
   * @return {boolean}
   */
  get isClosed() {
    return !this._client;
  }

  /**
   * Returns session id
   *
   * @return {*|string}
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
   * @return {Pool|*}
   */
  get pool() {
    return this._pool;
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
   * Decreases the internal reference counter. When reference count is 0, connection returns to the pool.
   *
   * @return {undefined}
   * @public
   */
  release() {
    if (this.isClosed || !this._refCount)
      throw new Error('Connection closed');
    if (!--this._refCount) {
      debug('[%s] close', this.sessionId);
      this._client = null;
      this._emitSafe('close');
    } else
      debug('[%s] release | refCount: %s', this.sessionId, this.referenceCount);
  }

  /**
   * Starts a transaction
   *
   * @param {Function} [callback]
   * @return {Promise|undefined}
   * @public
   */
  startTransaction(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.startTransaction(cb));

    if (this.isClosed)
      callback(new Error('Connection closed'));
    this._client.startTransaction((err) => {
      /* istanbul ignore else */
      if (!err) {
        debug('[%s] start transaction', this.sessionId);
        this._emitSafe('start-transaction');
      }
      callback(err);
    });
  }

  /**
   * Commits the current transaction in progress on the connection.
   *
   * @param {Function} [callback]
   * @return {Promise|undefined}
   * @public
   */
  commit(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.commit(cb));

    if (this.isClosed)
      return callback(new Error('Connection closed'));
    this._client.commit((err) => {
      /* istanbul ignore else */
      if (!err) {
        debug('[%s] commit', this.sessionId);
        this._emitSafe('commit');
      }
      callback(err);
    });
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
   * Rolls back the current transaction in progress on the connection.
   *
   * @param {Function} [callback]
   * @return {Promise|undefined}
   * @public
   */
  rollback(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.rollback(cb));

    if (this.isClosed)
      return callback(new Error('Connection closed'));
    this._client.rollback((err) => {
      /* istanbul ignore else */
      if (!err) {
        debug('[%s] rollback', this.sessionId);
        this._emitSafe('rollback');
      }
      callback(err);
    });
  }

  /**
   * This call Executes a query
   *
   * @param {String|Query} query
   * @param {Array|Object} [params]
   * @param {Object} [options]
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  execute(query, params, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    if (typeof params === 'function') {
      callback = params;
      options = undefined;
      params = undefined;
    }

    if (!callback)
      return promisify.fromCallback((cb) => this.execute(query, params, options, cb));

    const tm = Date.now();
    let prepared;
    let executeOptions;
    this.acquire(); // Increase reference to prevent un expected close
    waterfall([
      (next) => {
        prepared = this._prepare(query, params, options);
        executeOptions = prepared.executeOptions;
        delete prepared.executeOptions;
        this._emitSafe('execute', {
          sql: prepared.sql,
          params: prepared.values,
          options: executeOptions
        });
        /* istanbul ignore next */
        if (process.env.DEBUG)
          debug('[%s] execute | %o', this.sessionId, prepared);
        this._client.execute(prepared.sql, prepared.values, executeOptions, next);
      },

      (next, response) => {
        if (!response)
          return next('No response from database adapter');

        const result = {
          executeTime: Date.now() - tm
        };

        if (response.cursor) {
          result.cursor = new Cursor(this, response.cursor,
              response.fields, prepared);
        }
        if (response.rows) {
          /* Normalize rows */
          normalizeRows(response.rows, prepared);
          if (prepared.rowset)
            result.rowset =
                new Rowset(response.rows, response.fields, prepared);
          else {
            /* Call fetchEvents events if exists */
            if (prepared.fetchEvents && prepared.fetchEvents.length) {
              const flds = new FieldCollection(response.fields, prepared);
              response.rows.forEach((r) => {
                r = new Row(r, flds);
                prepared.fetchEvents.forEach((cb) => cb(r));
              });
            }
            result.fields = response.fields;
            result.rows = response.rows;
          }
        }

        if (response.returns)
          result.returns = response.returns;

        if (prepared && prepared.showSql) {
          result.sql = prepared.sql;
          result.values = prepared.values;
          result.options = executeOptions;
        }
        next(null, result);
      }

    ], (err, result) => {
      this.release();
      if (err) {
        err = new SqlError(err);
        /* istanbul ignore else*/
        if (prepared && prepared.showSql) {
          err.sql = prepared.sql;
          err.values = prepared.values;
          err.options = executeOptions;
        }
      }
      callback(err, result);
    });
  }

  /**
   * This call tests the connection.
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  test(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.test(cb));

    this._client.test(callback);
  }

  /**
   * Creates an executable SelectQuery associated with this connection.
   * @param {...*} column
   * @return {SelectQuery}
   */
  select(...column) {
    const query = this.pool.select(...column);
    query.connection = this;
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
    query.connection = this;
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
    query.connection = this;
    return query;
  }

  /**
   * Creates an executable DeleteQuery associated with this connection.
   * @param {String} tableName
   * @return {DeleteQuery}
   */
  delete(tableName) {
    const query = this.pool.delete(tableName);
    query.connection = this;
    return query;
  }

  toString() {
    return '[object Connection(' + this.sessionId + ')]';
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

  /**
   *
   * @param {Query} query
   * @param {Array|Object} values
   * @param {Object} options
   * @return {Object}
   * @private
   */
  _prepare(query, values, options) {
    options = options || {};
    const defaults = this.pool.config.defaults;
    const out = {
      sql: undefined,
      values: undefined,
      autoCommit: options.autoCommit || defaults.autoCommit,
      cursor: (options.cursor || defaults.cursor),
      rowset: (options.rowset || defaults.rowset),
      showSql: (options.showSql || defaults.showSql),
      fetchAsString: options.fetchAsString ?
          (Array.isArray(options.fetchAsString) ? options.fetchAsString : [options.fetchAsString])
          : undefined,
      fetchRows: options.fetchRows,
      ignoreNulls: (options.objectRows &&
          (options.ignoreNulls || defaults.ignoreNulls)),
      naming: options.naming || defaults.naming,
      objectRows: options.objectRows || defaults.objectRows,
      fetchEvents: options.onFetchRow
    };

    if (typeof query === 'object' &&
        typeof query.generate === 'function') {
      const o = query.generate(this.pool.config, values);
      out.sql = o.sql;
      out.values = o.values;
      out.returningParams = o.returningParams;
      out.fetchRows = out.fetchRows != null ? out.fetchRows : query._limit;
      out.action = query._action;
      out.clientId = query._clientId || this._clientId;
      out.module = query._module || this._module;
      if (query.listeners && query.listenerCount('fetch')) {
        out.fetchEvents = out.fetchEvents || [];
        out.fetchEvents.push.apply(out.fetchEvents, query.listeners('fetch'));
      }
    } else {
      out.sql = String(query);
      out.values = values;
      out.clientId = this._clientId;
      out.module = this._module;
    }
    out.fetchRows = out.fetchRows != null ? out.fetchRows : 100;

    out.executeOptions = {
      autoCommit: out.autoCommit,
      cursor: out.cursor,
      fetchRows: out.fetchRows,
      objectRows: out.objectRows,
      ignoreNulls: out.ignoreNulls,
      action: out.action,
      returningParams: out.returningParams
    };
    if (out.executeOptions.cursor)
      delete out.executeOptions.fetchRows;

    Object.getOwnPropertyNames(out.executeOptions).forEach((key) => {
      if (out.executeOptions[key] == null)
        delete out.executeOptions[key];
    });

    Object.getOwnPropertyNames(out).forEach((key) => {
      if (out[key] == null)
        delete out[key];
    });

    return out;
  }

}

Object.assign(Connection.prototype, sqlObjects);

/**
 * Expose `Connection`.
 */
module.exports = Connection;


