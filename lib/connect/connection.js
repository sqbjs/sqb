/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const DataSet = require('./dataset');
const DatasetMeta = require('./datasetmeta');
const {normalizeRows} = require('../helpers');

/* External module dependencies. */
const {EventEmitter} = require('events');
const debug = require('debug')('sqb:Connection');
const Promisify = require('putil-promisify');

/**
 * @class
 * @public
 */

class Connection extends EventEmitter {

  constructor(dbpool, nasted) {
    super();
    Object.defineProperty(this, 'dbpool',
        {value: dbpool, writable: false, configurable: false});
    this._refcount = 0;
    this._nasted = nasted;
  }

  // noinspection JSMethodCanBeStatic
  get isConnection() {
    return true;
  }

  get sessionId() {
    return this._nasted && this._nasted.sessionId;
  }

  get serverVersion() {
    return this._nasted && this._nasted.serverVersion;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @public
   */
  acquire() {
    this._refcount++;
    if (process.env.DEBUG)
      debug('[%s] acquired | refCount: %s', this.sessionId, this._refcount);
  }

  /**
   * @param {Function} callback
   * @return {Promise|undefined}
   * @public
   */
  close(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.close(cb));
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
      self._nasted.close((err) => {
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
  }

  select(...args) {
    const query = this.dbpool.select(...args);
    query.connection = this;
    return query;
  }

  insert(...args) {
    const query = this.dbpool.insert(...args);
    query.connection = this;
    return query;
  }

  update(...args) {
    const query = this.dbpool.update(...args);
    query.connection = this;
    return query;
  }

  //noinspection ReservedWordAsName
  delete(...args) {
    const query = this.dbpool.delete(...args);
    query.connection = this;
    return query;
  }

  execute(query, params, options, callback) {
    if (typeof options === 'function') {
      callback = undefined;
      options = {};
    }
    if (typeof params === 'function') {
      callback = params;
      options = undefined;
      params = undefined;
    }

    if (!callback)
      return Promisify.fromCallback((cb) => this.execute(query, params, options, cb));

    const self = this;
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
      self._nasted.execute(prepared.sql, prepared.values, executeOptions, (err, response) => {
        if (err)
          return callback(err);
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
          if (response.metaData)
            result.metaData = new DatasetMeta(response.metaData, prepared);
          if (response.rows)
            result.rows = response.rows;
        }

        result.executeTime = Date.now() - tm;
        if (options && options.debug) {
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
  }

  _prepare(query, values, options) {
    const self = this;
    const serializer = self.dbpool.serializer;
    const out = {
      sql: undefined,
      values: undefined,
      autoCommit: options.autoCommit,
      caching: options.caching,
      cursor: options.cursor || options.caching,
      dataset: options.dataset || options.cursor,
      debug: options.debug,
      extendedMetaData: options.extendedMetaData,
      fetchAsString: options.fetchAsString ?
          (Array.isArray(options.fetchAsString) ? options.fetchAsString : [options.fetchAsString])
          : undefined,
      fetchRows: options.fetchRows || 100,
      ignoreNulls: options.objectRows && options.ignoreNulls,
      naming: options.naming || self.dbpool.config.naming,
      objectRows: options.objectRows,
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
        out.onfetchrow.push(...query._onfetchrow);
      }
    } else {
      out.sql = String(query);
      out.values = values;
      out.clientId = self._clientId;
      out.module = self._module;
    }

    out.executeOptions = {
      autoCommit: out.autoCommit,
      extendedMetaData: out.extendedMetaData,
      cursor: out.cursor,
      fetchRows: out.fetchRows,
      objectRows: out.objectRows,
      ignoreNulls: out.ignoreNulls,
      action: out.action,
      returningParams: out.returningParams
    };

    return out;
  }

  /* Abstract members */

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @public
   * @abstract
   */
  commit() {
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @public
   * @abstract
   */
  rollback() {
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @public
   * @abstract
   */
  get isClosed() {
    return this._closed;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @public
   * @abstract
   */
  meta() {
    throw new Error(`Metadata support not implemented in dialect (${this.dialect})`);
  }

}

module.exports = Connection;
