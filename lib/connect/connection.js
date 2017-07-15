/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const {lowerCaseObjectKeys, upperCaseObjectKeys} = require('../helpers');

/* External module dependencies. */
const {EventEmitter} = require('events');
const debug = require('debug')('sqb:Connection');
const Promisify = require('putil-promisify');

/**
 * @class
 * @public
 */

class Connection extends EventEmitter {

  constructor(dbpool) {
    super();
    Object.defineProperty(this, 'dbpool',
        {value: dbpool, writable: false, configurable: false});
    this._refcount = 0;
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
      if (self.closed) {
        callback();
        return;
      }
      self._close((err) => {
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
      const o = self._prepare(query, params, options);
      self.dbpool.emit('execute', o);
      if (process.env.DEBUG)
        debug('[%s] execute | %o', self.sessionId, o);
      const opts = o.options;
      self._execute(o.sql, o.params, opts, (err, result) => {
        self.close(); // Release reference
        if (options.debug) {
          result.sql = o.sql;
          result.params = o.params;
          result.options = opts;
        }
        if (result && result.rows) {
          const frws = opts.onfetchrow && opts.onfetchrow.length;
          if (frws || opts.fieldNaming) {
            result.rows.forEach((row, idx) => {
              if (opts.fieldNaming === 'lowercase')
                row = lowerCaseObjectKeys(row);
              else if (opts.fieldNaming === 'uppercase')
                row = upperCaseObjectKeys(row);
              if (frws)
                opts.onfetchrow.forEach(fn => {
                  fn(row, idx + 1);
                });
            });
          }
        }
        callback(err, result);
      });
    } catch (e) {
      self.close();
      callback(e);
    }
  }

  _prepare(query, params, options) {
    const self = this;
    const serializer = self.dbpool.serializer;
    const out = {
      sql: undefined,
      params: undefined,
      options: undefined,
      action: query ? query._action : undefined,
      clientId: query ? query._clientId : undefined,
      module: query ? query._module : undefined
    };

    if (typeof query === 'object' &&
        typeof query.build === 'function') {
      const o = serializer.build(query, params);
      out.sql = o.sql;
      out.params = o.params;
    } else {
      out.sql = query;
      out.params = params;
    }

    options = options || {};
    const opts = out.options = {};
    opts.autoCommit = !!opts.autoCommit;
    opts.extendedMetaData = !!(opts.extendedMetaData || options.resultSet);
    opts.resultSet = !!options.resultSet;
    opts.fieldNaming = options.fieldNaming || self.dbpool.config.fieldNaming;
    opts.objectRows = !!options.objectRows && !opts.resultSet;
    if (options.objectRows)
      opts.ignoreNulls = !!options.ignoreNulls;
    if (opts.resultSet) {
      const o = typeof options.resultSet === 'object' ? options.resultSet : {};
      opts.prefetchRows = o.prefetchRows || 100;
      opts.caching = !!o.caching;
      opts.bidirectional = !!o.bidirectional;
      if (o.onfetchrow)
        opts.onfetchrow = [o.onfetchrow];
    } else {
      opts.maxRows =
          Math.min(options.maxRows || 100, query._limit || 100);
    }
    if (query._onfetchrow && query._onfetchrow.length)
      opts.onfetchrow = opts.onfetchrow.concat(query._onfetchrow);
    opts.action = query._action;
    opts.clientId = query._clientId || self._clientId;
    opts.module = query._module || self._module;
    opts.debug = !!options.debug;
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
  get closed() {
    return this._closed;
  }

  /**
   *
   * @public
   * @abstract
   */
  get sessionId() {
    return this._sessionId;
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

  /**
   * @param {Function} callback
   * @protected
   * @abstract
   */
  _close(callback) {
  }

  /**
   *
   * @protected
   * @abstract
   */
  _execute() {
  }

}

module.exports = Connection;
