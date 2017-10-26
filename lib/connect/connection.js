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
const DataSet = require('./dataset');
const DatasetMeta = require('./datasetmeta');
const normalizeRows = require('../normalizeRows');
const SqlError = require('../errors').SqlError;
const DatasetMode = require('../types').DatasetMode;

/**
 * Expose `Connection`.
 */
module.exports = Connection;

/**
 *
 * @param {DbPool} dbpool
 * @param {Object} nasted
 * @constructor
 */
function Connection(dbpool, nasted) {
  EventEmitter.call(this);
  Object.defineProperty(this, 'dbpool',
      {value: dbpool, writable: false, configurable: false});
  this._refcount = 1;
  this._nconn = nasted;
  this._sessionId = nasted.sessionId;
}

const proto = Connection.prototype = {

  get isConnection() {
    return true;
  },

  get sessionId() {
    return this._sessionId;
  },

  get serverVersion() {
    return this._nconn && this._nconn.serverVersion;
  },

  /**
   *
   * @public
   * @abstract
   */
  get isClosed() {
    return !this._nconn;
  }
};
Object.setPrototypeOf(proto, EventEmitter.prototype);
proto.constructor = Connection;

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @public
 */
proto.acquire = function() {
  this._refcount++;
  if (process.env.DEBUG)
    debug('[%s] acquired | refCount: %s', this.sessionId, this._refcount);
};

/**
 * @param {Function} callback
 * @return {Promise|undefined}
 * @public
 */
proto.close = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.close(cb);
    });

  const rc = --self._refcount;
  if (rc) {
    if (process.env.DEBUG)
      debug('[%s] released | refCount: %s', self.sessionId, rc);
    callback(undefined, rc);
    return;
  }
  if (self.isClosed)
    return callback();

  if (process.env.DEBUG)
    debug('[%s] close', self.sessionId);
  self.emit('close');
  callback();
};

/**
 * @param {Function} callback
 * @return {Promise|undefined}
 * @public
 */
proto.commit = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.commit(cb);
    });
  if (self.isClosed)
    return callback();
  self._nconn.commit(function(err) {
    if (!err && process.env.DEBUG)
      debug('[%s] commit', self.sessionId);
    callback(err);
  });
};

/**
 * @param {Function} callback
 * @return {Promise|undefined}
 * @public
 */
proto.rollback = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.rollback(cb);
    });
  if (self.isClosed)
    return callback();
  self._nconn.rollback(function(err) {
    if (!err && process.env.DEBUG)
      debug('[%s] rollback', self.sessionId);
    callback(err);
  });
};

proto.select = function(args) {
  const query = this.dbpool.select.apply(this.dbpool, arguments);
  query.connection = this;
  return query;
};

proto.insert = function(args) {
  const query = this.dbpool.insert.apply(proto, arguments);
  query.connection = this;
  return query;
};

proto.update = function(args) {
  const query = this.dbpool.update.apply(proto, arguments);
  query.connection = this;
  return query;
};

proto.delete = function(args) {
  const query = this.dbpool.delete.apply(proto, arguments);
  query.connection = this;
  return query;
};

proto.execute = function(query, params, options, callback) {
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
      self.dbpool.emit('execute', prepared);
      if (process.env.DEBUG)
        debug('[%s] execute | %o', self.sessionId, prepared);
      self._nconn.execute(prepared.sql, prepared.values, executeOptions, next);
    },
    function(next, response) {
      const result = {};
      if (response.rows)
        normalizeRows(response.rows, prepared);
      if (prepared.datasetMode) {
        result.dataset = new DataSet(self, response, prepared);
      } else {
        if (response.metaData && prepared.metaData) {
          const md = new DatasetMeta(response.metaData, prepared);
          result.metaData =
              prepared.metaData === 'extended' ? md : md.toJSON();
        }
        if (response.rows) {
          result.rows = response.rows;
          result.rowCount = result.rows.length;
        }
        if (response.returns)
          result.returns = response.returns;
      }

      result.executeTime = Date.now() - tm;
      if (options && options.detailedErrors) {
        result.sql = prepared.sql;
        result.values = prepared.values;
        result.options = executeOptions;
      }
      next(undefined, result);
    }
  ], function(err, result) {
    self.close();
    if (err) {
      err = new SqlError(err);
      if (prepared && prepared.detailedErrors) {
        err.sql = prepared.sql;
        err.values = prepared.values;
        err.options = executeOptions;
      }
    }
    callback(err, result);
  });
};

proto._prepare = function(query, values, options) {
  const self = this;
  options = options || {};
  const out = {
    sql: undefined,
    values: undefined,
    autoCommit: options.autoCommit || self.dbpool.defaults.autoCommit,
    datasetMode: (options.datasetMode || self.dbpool.defaults.datasetMode),
    detailedErrors: options.detailedErrors ||
    self.dbpool.defaults.detailedErrors,
    metaData: (options.metaData || self.dbpool.defaults.metaData),
    fetchAsString: options.fetchAsString ?
        (Array.isArray(options.fetchAsString) ? options.fetchAsString : [options.fetchAsString])
        : undefined,
    fetchRows: options.fetchRows || 100,
    ignoreNulls: options.objectRows && options.ignoreNulls,
    naming: options.naming || self.dbpool.defaults.naming,
    objectRows: options.objectRows || self.dbpool.defaults.objectRows,
    onfetchrow: options.onfetchrow
  };

  if (typeof query === 'object' &&
      typeof query.generate === 'function') {
    const serializer = self.dbpool.serializer;
    const o = query.generate(serializer, values);
    out.sql = o.sql;
    out.values = o.values;
    out.returningParams = o.returningParams;
    out.action = query._action;
    out.clientId = query._clientId || self._clientId;
    out.module = query._module || self._module;
    if (query._onfetchrow && query._onfetchrow.length) {
      out.onfetchrow = out.onfetchrow || [];
      out.onfetchrow.push.apply(null, query._onfetchrow);
    }
  } else {
    out.sql = String(query);
    out.values = values;
    out.clientId = self._clientId;
    out.module = self._module;
  }

  out.executeOptions = {
    autoCommit: out.autoCommit,
    metaData: out.metaData,
    cursor: (out.datasetMode === DatasetMode.CURSOR ||
        out.datasetMode === DatasetMode.CACHED),
    fetchRows: out.fetchRows,
    objectRows: out.objectRows,
    ignoreNulls: out.ignoreNulls,
    action: out.action,
    returningParams: out.returningParams
  };
  if (out.executeOptions.cursor)
    delete out.executeOptions.fetchRows;

  Object.getOwnPropertyNames(out.executeOptions).forEach(function(key) {
    if (out.executeOptions[key] === undefined)
      delete out.executeOptions[key];
  });

  Object.getOwnPropertyNames(out).forEach(function(key) {
    if (out[key] === undefined)
      delete out[key];
  });

  return out;
};

proto.test = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.test(cb);
    });
  this._nconn.test(callback);
};
