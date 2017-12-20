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
const debug = require('debug')('sqb:Connection');
const promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');
const defineConst = require('putil-defineconst');
const Cursor = require('./Cursor');
const Rowset = require('./Rowset');
const FieldCollection = require('./FieldCollection');
const Row = require('./Row');
const DBMeta = require('../meta_data/DBMeta');
const normalizeRows = require('../helper/normalizeRows');
const SqlError = require('../error/SqlError');
const sqlObjects = require('../helper/sqbexport');

/**
 * Expose `Connection`.
 */
module.exports = Connection;

/**
 *
 * @param {Pool} pool
 * @param {Object} client
 * @constructor
 */
function Connection(pool, client) {
  EventEmitter.call(this);
  defineConst(this, {
    _pool: pool,
    _sessionId: client.sessionId,
    _metaData: new DBMeta(this, pool._driver)
  }, false);
  defineConst(this, {
    _client: client,
    _refCount: 1
  }, {
    writable: true,
    enumerable: false
  });
}

Connection.prototype = {

  get isConnection() {
    return true;
  },

  get isClosed() {
    return !this._client;
  },

  get sessionId() {
    return this._sessionId;
  },

  get referenceCount() {
    return this._refCount;
  },

  get pool() {
    return this._pool;
  },

  get metaData() {
    return this._metaData;
  }

};
Object.setPrototypeOf(Connection.prototype, EventEmitter.prototype);
Object.assign(Connection.prototype, sqlObjects);
Connection.prototype.constructor = Connection;

/**
 * Increases internal reference counter of connection instance
 *
 * @public
 */
Connection.prototype.acquire = function() {
  this._refCount++;
  debug('[%s] acquired | refCount: %s', this.sessionId, this._refCount);
};

/**
 * Decreases the internal reference counter. When reference count is 0, connection returns to the pool.
 *
 * @return {undefined}
 * @public
 */
Connection.prototype.release = function() {
  if (this.isClosed || !this._refCount)
    throw new Error('Connection closed');
  if (!--this._refCount) {
    debug('[%s] close', this.sessionId);
    this._client = null;
    this._emitSafe('close');
  } else
    debug('[%s] release | refCount: %s', this.sessionId, this.referenceCount);
};

/**
 * Starts a transaction
 *
 * @param {Function} callback
 * @return {Promise|undefined}
 * @public
 */
Connection.prototype.startTransaction = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.startTransaction(cb);
    });
  if (this.isClosed)
    callback(new Error('Connection closed'));
  self._client.startTransaction(function(err) {
    /* istanbul ignore else */
    if (!err) {
      debug('[%s] start transaction', self.sessionId);
      self._emitSafe('start-transaction');
    }
    callback(err);
  });
};

/**
 * Commits the current transaction in progress on the connection.
 *
 * @param {Function} callback
 * @return {Promise|undefined}
 * @public
 */
Connection.prototype.commit = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.commit(cb);
    });
  if (this.isClosed)
    return callback(new Error('Connection closed'));
  self._client.commit(function(err) {
    /* istanbul ignore else */
    if (!err) {
      debug('[%s] commit', self.sessionId);
      self._emitSafe('commit');
    }
    callback(err);
  });
};

/**
 * Returns values of properties that connection adapter exposes.
 *
 * @param {String} param
 * @return {*}
 */
Connection.prototype.get = function(param) {
  return this._client && (typeof this._client.get === 'function') &&
      this._client.get(param);
};

/**
 * Rolls back the current transaction in progress on the connection.
 *
 * @param {Function} callback
 * @return {Promise|undefined}
 * @public
 */
Connection.prototype.rollback = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.rollback(cb);
    });
  if (this.isClosed)
    return callback(new Error('Connection closed'));
  self._client.rollback(function(err) {
    /* istanbul ignore else */
    if (!err) {
      debug('[%s] rollback', self.sessionId);
      self._emitSafe('rollback');
    }
    callback(err);
  });
};

/**
 * This call Executes a query
 *
 * @param {String|Query} query
 * @param {Array|Object} [params]
 * @param {Object} [options]
 * @param {Function} callback
 * @return {Promise|undefined}
 */
Connection.prototype.execute = function(query, params, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  if (typeof params === 'function') {
    callback = params;
    options = undefined;
    params = undefined;
  }

  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.execute(query, params, options, cb);
    });

  const tm = Date.now();
  var prepared;
  var executeOptions;
  self.acquire(); // Increase reference to prevent un expected close
  waterfall([
    function(next) {
      prepared = self._prepare(query, params, options);
      executeOptions = prepared.executeOptions;
      delete prepared.executeOptions;
      self._emitSafe('execute', prepared.sql, prepared.values, executeOptions);
      /* istanbul ignore next */
      if (process.env.DEBUG)
        debug('[%s] execute | %o', self.sessionId, prepared);
      self._client.execute(prepared.sql, prepared.values, executeOptions, next);
    },
    function(next, response) {
      if (!response)
        return next('No response from database driver');

      const result = {
        executeTime: Date.now() - tm
      };

      if (response.cursor) {
        result.cursor =
            new Cursor(self, response.cursor, response.fields, prepared);
      }
      if (response.rows) {
        /* Normalize rows */
        normalizeRows(response.rows, prepared);
        if (prepared.rowset)
          result.rowset = new Rowset(response.rows, response.fields, prepared);
        else {
          /* Call fetchEvents events if exists */
          if (prepared.fetchEvents && prepared.fetchEvents.length) {
            const flds = new FieldCollection(response.fields, prepared);
            response.rows.forEach(function(r) {
              r = new Row(r, flds);
              prepared.fetchEvents.forEach(function(cb) {
                cb(r);
              });
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
      next(undefined, result);
    }
  ], function(err, result) {
    self.release();
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
};

/**
 * This call tests the connection.
 * @param {Function} callback
 * @return {Promise|undefined}
 */
Connection.prototype.test = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.test(cb);
    });
  this._client.test(callback);
};

/**
 * Creates an executable SelectQuery associated with this connection.
 * @param {...*} column
 * @return {SelectQuery}
 */
Connection.prototype.select = function(column) {
  const query = this.pool.select.apply(this.pool, arguments);
  query.connection = this;
  return query;
};

/**
 * Creates an executable InsertQuery associated with this connection.
 * @param {...String|Column} column
 * @return {InsertQuery}
 */
Connection.prototype.insert = function(column) {
  const query = this.pool.insert.apply(this.pool, arguments);
  query.connection = this;
  return query;
};

/**
 * Creates an executable UpdateQuery associated with this connection.
 * @param {String} table
 * @return {UpdateQuery}
 */
Connection.prototype.update = function(table) {
  const query = this.pool.update.apply(this.pool, arguments);
  query.connection = this;
  return query;
};

/**
 * Creates an executable DeleteQuery associated with this connection.
 * @param {String} table
 * @return {DeleteQuery}
 */
Connection.prototype.delete = function(table) {
  const query = this.pool.delete.apply(this.pool, arguments);
  query.connection = this;
  return query;
};

/*
 * Private Methods
 */

Connection.prototype._emitSafe = function() {
  try {
    this.emit.apply(this, arguments);
  } catch (e) {
    //
  }
};

/**
 *
 * @param {Query} query
 * @param {Array|Object} values
 * @param {Object} options
 * @return {Object}
 * @private
 */
Connection.prototype._prepare = function(query, values, options) {
  const self = this;
  options = options || {};
  const out = {
    sql: undefined,
    values: undefined,
    autoCommit: options.autoCommit || self.pool.defaults.autoCommit,
    cursor: (options.cursor || self.pool.defaults.cursor),
    rowset: (options.rowset || self.pool.defaults.rowset),
    showSql: (options.showSql || self.pool.defaults.showSql),
    fetchAsString: options.fetchAsString ?
        (Array.isArray(options.fetchAsString) ? options.fetchAsString : [options.fetchAsString])
        : undefined,
    fetchRows: options.fetchRows,
    ignoreNulls: (options.objectRows &&
        (options.ignoreNulls || self.pool.defaults.ignoreNulls)),
    naming: options.naming || self.pool.defaults.naming,
    objectRows: options.objectRows || self.pool.defaults.objectRows,
    fetchEvents: options.onFetchRow
  };

  if (typeof query === 'object' &&
      typeof query.generate === 'function') {
    const serializer = self.pool.serializer;
    const o = query.generate(serializer, values);
    out.sql = o.sql;
    out.values = o.values;
    out.returningParams = o.returningParams;
    out.fetchRows = out.fetchRows || query._limit;
    out.action = query._action;
    out.clientId = query._clientId || self._clientId;
    out.module = query._module || self._module;
    if (query.listeners && query.listenerCount('fetch')) {
      out.fetchEvents = out.fetchEvents || [];
      out.fetchEvents.push.apply(out.fetchEvents, query.listeners('fetch'));
    }
  } else {
    out.sql = String(query);
    out.values = values;
    out.clientId = self._clientId;
    out.module = self._module;
  }
  out.fetchRows = out.fetchRows || 100;

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

  Object.getOwnPropertyNames(out.executeOptions).forEach(function(key) {
    if (out.executeOptions[key] == null)
      delete out.executeOptions[key];
  });

  Object.getOwnPropertyNames(out).forEach(function(key) {
    if (out[key] == null)
      delete out[key];
  });

  return out;
};
