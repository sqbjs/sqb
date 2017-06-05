/* SQB-connect
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Promisify = require('../helpers/promisify');

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

  execute(statement, params, options, callback) {

    const self = this;

    function prepare() {
      if (typeof params === 'function') {
        callback = params;
        params = undefined;
        options = undefined;
      } else if (typeof options === 'function') {
        callback = options;
        options = undefined;
      }

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
      options.autoCommit =
          options.autoCommit !== undefined ? options.autoCommit : false;
      options.extendedMetaData = options.extendedMetaData !==
      undefined ? options.extendedMetaData : false;
      options.prefetchRows =
          options.prefetchRows !== undefined ? options.prefetchRows : 100;
      options.maxRows = statement._limit ? statement._limit : 100;
      options.resultSet =
          options.resultSet !== undefined ? options.resultSet : false;
      options.objectRows =
          options.objectRows !== undefined ? options.objectRows : false;
      options.showSql = options.showSql !== undefined ? options.showSql : false;

      out.options = options;
      return out;
    }

    function doExecute(cb) {
      self.acquire(); // Increase reference to prevent un expected close
      try {
        const o = prepare();
        self.dbpool.emit('execute', o);
        if (process.env.DEBUG)
          debug('[%s] execute | %o', self.sessionId, o);
        self._execute(o.sql, o.params, o.options, (err, result) => {
          self.close(); // Release reference
          if (options.autoClose) self.close();
          console.log('adfadsfds');
          cb(err, result);
        });
      } catch (e) {
        self.release();
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
