/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Promisify = require('putil-promisify');

/* External module dependencies. */
const {EventEmitter} = require('events');
const debug = require('debug')('sqb:Connection');

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
    self._refcount--;
    if (!self._refcount) {
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
    } else if (process.env.DEBUG)
      debug('[%s] released | refCount: %s', this.sessionId, this._refcount);
  }

  select(...args) {
    const statement = this.dbpool.select(...args);
    statement.connection = this;
    return statement;
  }

  insert(...args) {
    const statement = this.dbpool.insert(...args);
    statement.connection = this;
    return statement;
  }

  update(...args) {
    const statement = this.dbpool.update(...args);
    statement.connection = this;
    return statement;
  }

  //noinspection ReservedWordAsName
  delete(...args) {
    const statement = this.dbpool.delete(...args);
    statement.connection = this;
    return statement;
  }

  prepare(statement, params, options) {
    const self = this;
    const serializer = self.dbpool.serializer;
    const out = {
      sql: undefined,
      params: undefined,
      options: undefined,
      action: statement ? statement._action : undefined,
      clientId: statement ? statement._clientId : undefined,
      module: statement ? statement._module : undefined
    };

    if (typeof statement === 'object' &&
        typeof statement.build === 'function') {
      const o = serializer.build(statement, params);
      out.sql = o.sql;
      out.params = o.params;

      //noinspection JSUnresolvedVariable
      options = options || statement._options;
    } else {
      out.sql = statement;
      out.params = params;
    }

    options = options || {};
    options.action = statement._action;
    options.clientId = statement._clientId || self._clientId;
    options.module = statement._module || self._module;
    options.autoCommit = !!options.autoCommit;
    options.debug = !!options.debug;

    let o = [];
    if (options.onfetchrow) o.push(options.onfetchrow);
    if (statement._onfetchrow && statement._onfetchrow.length)
      o = o.concat(statement._onfetchrow);
    options.onfetchrow = o;

    if (options.resultSet) {
      options.prefetchRows = options.prefetchRows || 100;
      options.extendedMetaData = true;
      if (typeof options.resultSet !== 'object')
        options.resultSet = {};
      options.resultSet.onfetchrow = options.onfetchrow;
      options.resultSet.prefetchRows = options.prefetchRows;
      options.resultSet.objectRows = options.resultSet.objectRows ||
          options.objectRows || options.objectRows === undefined;
    } else {
      options.maxRows =
          Math.min(options.maxRows || 100, statement._limit || 100);
      options.extendedMetaData = !!options.extendedMetaData;
      options.objectRows = !!options.objectRows;
    }

    out.options = options;
    return out;
  }

  execute(statement, params, options, callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.execute(statement, params, options, cb));

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
      const o = self.prepare(statement, params, options);
      self.dbpool.emit('execute', o);
      if (process.env.DEBUG)
        debug('[%s] execute | %o', self.sessionId, o);
      options = o.options;

      self._execute(o.sql, o.params, options, (err, result) => {
        self.close(); // Release reference
        if (options.onfetchrow && options.onfetchrow.length &&
            result && result.rows) {
          result.rows.forEach((row, idx) => {
            options.onfetchrow.forEach(fn => {
              fn(row, idx + 1);
            });
          });
        }
        callback(err, result);
      });
    } catch (e) {
      self.close();
      callback(e);
    }
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
