/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const plugins = require('../plugins');
const Serializer = require('../serializer');
const Connection = require('./connection');
const DatabaseMetaData = require('./metadata');
const SelectQuery = require('../query/selectquery');
const InsertQuery = require('../query/insertquery');
const UpdateQuery = require('../query/updatequery');
const DeleteQuery = require('../query/deletequery');
const sqlObjects = require('../defs');

/* External module dependencies. */
const {EventEmitter} = require('events');
const assert = require('assert');
const debug = require('debug')('sqb:DbPool');
const Promisify = require('putil-promisify');

/**
 * @class
 * @public
 */

class DbPool extends EventEmitter {

  /**
   * @constructor
   * @param {String|Object} config
   * @param {string} config.dialect
   * @param {string} config.user
   * @param {string} config.password
   * @param {string} config.connectString
   * @param {string} config.naming
   * @param {Object} config.pool
   * @param {int} config.pool.max
   * @param {int} config.pool.min
   * @param {int} config.pool.increment
   * @param {int} config.pool.timeout
   */
  constructor(config) {
    super();

    config = typeof config === 'object' ? config : {dialect: config};
    const pool = config.pool = config.pool || {};
    pool.max = pool.max || 10;
    pool.min = pool.min || 0;
    pool.increment = pool.increment || 1;
    pool.idleTimeout = pool.idleTimeout || 60;
    const self = this;
    self.nastedPool = plugins.createPool(config);
    assert(self.nastedPool, `No connection plugin registered for dialect "${config.dialect}"`);
    self.serializer = new Serializer(config);

    Object.defineProperty(this, 'config',
        {value: Object.freeze(config), writable: false, configurable: false});
    Object.assign(this, sqlObjects);
    this._metaData = new DatabaseMetaData(this);
  }

  //noinspection JSUnusedGlobalSymbols
  get dialect() {
    return this.config.dialect;
  }

  get isClosed() {
    return this._closed;
  }

  //noinspection JSUnusedGlobalSymbols
  get user() {
    return this.config.user;
  }

  //noinspection JSUnusedGlobalSymbols
  get schema() {
    return this.config.schema;
  }

  //noinspection JSMethodCanBeStatic
  select(...columns) {
    const query = new SelectQuery(...columns);
    query.dbpool = this;
    return query;
  }

  //noinspection JSMethodCanBeStatic
  insert(...columns) {
    const query = new InsertQuery(...columns);
    query.dbpool = this;
    return query;
  }

  //noinspection JSMethodCanBeStatic
  update(table, values) {
    const query = new UpdateQuery(table, values);
    query.dbpool = this;
    return query;
  }

  //noinspection JSMethodCanBeStatic,ReservedWordAsName
  delete(table) {
    const query = new DeleteQuery(table);
    query.dbpool = this;
    return query;
  }

  //noinspection JSUnusedGlobalSymbols
  connect(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.connect(cb));

    if (process.env.DEBUG)
      debug('connect | Creating new connection..');

    const self = this;
    self.nastedPool.connect((error, nconn) => {
      if (process.env.DEBUG) {
        if (error)
          debug('Error: ' + error.message);
        else
          debug('[%s] connected', nconn.sessionId);
      }
      let connection;
      if (nconn) {
        connection = new Connection(self, nconn);
        connection.acquire();
      }
      try {
        const o = callback(error, connection);
        if (o && (o instanceof Promise ||
                (typeof o.then === 'function' &&
                    typeof o.catch === 'function'))) {
          o.catch(() => {
            if (connection)
              connection.rollback(() => connection.close());
          });
        }
      } catch (e) {
        if (connection)
          connection.rollback(() => connection.close(() => {}));
        throw e;
      }
    });
  }

  close(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.close(cb));
    this.nastedPool.close((err) => {
      if (!err)
        this._closed = true;
      callback(err);
    });
  }

  //noinspection JSUnusedGlobalSymbols
  test(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.test(cb));
    this.select('1').execute((err) => {
      callback(err);
    });
  }

  /* Abstract members */

  //noinspection JSUnusedGlobalSymbols
  get metaData() {
    return this._metaData;
  }

}

module.exports = DbPool;
