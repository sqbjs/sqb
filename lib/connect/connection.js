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
   * @public
   */
  close() {
    this._refcount--;
    if (!this._refcount) {
      if (process.env.DEBUG)
        debug('[%s] closed', this.sessionId);
      //noinspection JSUnresolvedFunction
      this.emit('close', this);
      this._close();
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
    options.resultSet = options.resultSet;
    if (options.resultSet) {
      options.extendedMetaData = true;
      options.objectRows = false;
      options.prefetchRows =
          options.prefetchRows !== undefined ? options.prefetchRows : 100;
    } else {
      options.maxRows =
          Math.min(options.maxRows || 100, statement._limit || 100);
      options.extendedMetaData = !!options.extendedMetaData;
      options.objectRows = !!options.objectRows;
    }
    options.debug = !!options.debug;
    options.onfetchrow = options.onfetchrow || statement._onfetchrow;
    out.options = options;

    return out;
  }

  execute(statement, params, options, callback) {

    const self = this;
    if (typeof params === 'function') {
      callback = params;
      params = undefined;
      options = undefined;
    } else if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    function doExecute(cb) {
      self.acquire(); // Increase reference to prevent un expected close
      try {
        const o = self.prepare(statement, params, options);
        self.dbpool.emit('execute', o);
        if (process.env.DEBUG)
          debug('[%s] execute | %o', self.sessionId, o);
        options = o.options;
        self._execute(o.sql, o.params, options, (err, result) => {
          self.close(); // Release reference
          if (options && options.autoClose) self.close();
          if (options.onfetchrow && result && result.rows) {
            result.rows.forEach((row, idx) => {
              options.onfetchrow(row, idx + 1);
            });
          }
          cb(err, result);
        });
      } catch (e) {
        self.close();
        cb(e);
      }
    }

    if (callback)
      doExecute(callback);
    else return Promisify.fromCallback(doExecute);
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
    return true;
  }

  /**
   *
   * @public
   * @abstract
   */
  get sessionId() {
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
   *
   * @protected
   * @abstract
   */
  _close() {
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
