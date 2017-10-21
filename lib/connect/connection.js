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
const debug = require('debug')('sqb:Connection');
const Promisify = require('putil-promisify');
const merge = require('putil-merge');
const DataSet = require('./dataset');
const DatasetMeta = require('./datasetmeta');
const normalizeRows = require('../normalizeRows');
const SqlError = require('../errors').SqlError;

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
  this._refcount = 0;
  this._nasted = nasted;
}

const proto = Connection.prototype = {

  get isConnection() {
    return true;
  },

  get sessionId() {
    return this._nasted && this._nasted.sessionId;
  },

  get serverVersion() {
    return this._nasted && this._nasted.serverVersion;
  },

  /**
   *
   * @public
   * @abstract
   */
  get isClosed() {
    return this._closed;
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
  if (!callback)
    return Promisify.fromCallback(this.close.bind(this));
  const self = this;
  const rc = --self._refcount;
  if (rc) {
    if (process.env.DEBUG)
      debug('[%s] released | refCount: %s', self.sessionId, rc);
    callback(undefined, rc);
  } else {
    if (self.isClosed) {
      callback();
      return;
    }
    self._nasted.close(function(err) {
      callback(err);
      if (err)
        self.emit('error', err);
      else {
        self._closed = true;
        self.emit('close');
        if (process.env.DEBUG)
          debug('[%s] closed', self.sessionId);
        self._sessionId = undefined;
      }
    });
  }
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

//noinspection ReservedWordAsName
proto.delete = function(args) {
  const query = this.dbpool.delete.apply(proto, arguments);
  query.connection = this;
  return query;
};

proto.execute = function(query, params, options, callback) {
  if (typeof options === 'function') {
    callback = undefined;
    options = {};
  }
  if (typeof params === 'function') {
    callback = params;
    options = undefined;
    params = undefined;
  }

  const self = this;
  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.execute(query, params, options, cb);
    });

  if (typeof params === 'function') {
    callback = params;
    params = undefined;
    options = undefined;
  } else if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  self.acquire(); // Increase reference to prevent un expected close
  try {
    const prepared = self._prepare(query, params, options);
    const executeOptions = prepared.executeOptions;
    delete prepared.executeOptions;
    self.dbpool.emit('execute', prepared);
    if (process.env.DEBUG)
      debug('[%s] execute | %o', self.sessionId, prepared);
    const tm = Date.now();
    self._nasted.execute(prepared.sql, prepared.values, executeOptions, function(err, response) {
      if (err) {
        err = new SqlError(err);
        if (prepared.detailedErrors) {
          err.sql = prepared.sql;
          err.values = prepared.values;
          err.options = executeOptions;
        }
        return callback(err);
      }
      self.close(); // Release reference
      const result = {};
      const opts = executeOptions;
      if (response.rows)
        normalizeRows(response.rows, prepared);

      if (prepared.dataset) {
        opts.connection = self;
        opts.metaData = response.metaData;
        opts.rows = response.rows;
        opts.cursor = response.cursor;
        opts.caching = options.caching;
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
        result.options = opts;
      }
      callback(undefined, result);
    });
  } catch (e) {
    self.close();
    callback(e);
  }
};

proto._prepare = function(query, values, options) {
  const self = this;
  const serializer = self.dbpool.serializer;
  options = options || {};
  const out = {
    sql: undefined,
    values: undefined,
    autoCommit: options.autoCommit || self.dbpool.defaults.autoCommit,
    caching: options.caching,
    cursor: options.cursor || options.caching,
    dataset: (options.dataset || options.cursor ||
        self.dbpool.defaults.dataset),
    detailedErrors: options.detailedErrors || self.dbpool.config.detailedErrors,
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

  out.executeOptions = merge({
    filter: function(obj, key, value) {
      return value !== undefined;
    }
  }, {}, {
    autoCommit: out.autoCommit,
    metaData: out.metaData,
    cursor: out.cursor,
    fetchRows: out.fetchRows,
    objectRows: out.objectRows,
    ignoreNulls: out.ignoreNulls,
    action: out.action,
    returningParams: out.returningParams
  });

  Object.getOwnPropertyNames(out).forEach(function(key) {
    if (out[key] === undefined)
      delete out[key];
  });

  return out;
};

/* Abstract members */

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @public
 * @abstract
 */
proto.commit = function() {
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @public
 * @abstract
 */
proto.rollback = function() {
};

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @public
 * @abstract
 */
proto.meta = function() {
  throw new ArgumentError('Metadata support not implemented in dialect `%s`', this.dialect);
};

