/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const sqlObjects = require('../sqbexport');
const Promisify = require('putil-promisify');

/* External module dependencies. */
const {EventEmitter} = require('events');
const debug = require('debug')('sqb:DbPool');

/**
 * @class
 * @public
 */

class DbPool extends EventEmitter {

  constructor(config) {
    super();
    config = typeof config === 'object' ? config : {dialect: config};
    const pool = config.pool = config.pool || {};
    pool.max = pool.max || 10;
    pool.min = pool.min || 0;
    pool.increment = pool.increment || 1;
    pool.timeout = pool.timeout || 60;
    Object.defineProperty(this, 'config',
        {value: Object.freeze(config), writable: false, configurable: false});
    Object.assign(this, sqlObjects);
  }

  //noinspection JSUnusedGlobalSymbols
  get dialect() {
    return this.config.dialect;
  }

  //noinspection JSUnusedGlobalSymbols
  get user() {
    return this.config.user;
  }

  //noinspection JSUnusedGlobalSymbols
  get schema() {
    return this.config.schema;
  }

  //noinspection JSUnusedGlobalSymbols
  connect(callback) {
    if (process.env.DEBUG)
      debug('connect | Creating new connection..');

    const self = this;

    function doConnect(cb) {
      self._getConnection((error, connection) => {
        if (process.env.DEBUG) {
          if (error)
            debug('connect failed: ' + error.message);
          else
            debug('[%s] connected', connection.sessionId);
        }
        if (connection)
          connection.acquire();
        cb(error, connection);
      });
    }

    if (callback)
      doConnect(callback);
    else return Promisify.fromCallback(doConnect);

  }

  //noinspection JSUnusedGlobalSymbols
  testConnection(callback) {
    return this.select('1').then(callback);
  }

  /* Abstract members */

  //noinspection JSUnusedGlobalSymbols
  meta() {
    throw new Error(`Metadata support not implemented in dialect (${this.dialect})`);
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  /**
   *
   * @param {Function} callback
   * @private
   */
  _getConnection(callback) {
    throw new Error('Abstract error');
  }

}

DbPool.register = function(dialect, poolProto) {
  const items = this._registry = this._registry || {};
  items[dialect] = poolProto;
};

DbPool.get = function(dialect) {
  return this._registry ? this._registry[dialect] : undefined;
};

/**
 * Creates a new database pool
 * @param {Object} config
 * @return {DbPool}
 */
DbPool.create = function(config) {
  if (config instanceof DbPool)
    return config;

  config = typeof config === 'string' ?
      {dialect: config} :
      typeof config === 'object' ?
          config :
          {};

  if (!config.dialect || config.dialect === 'generic')
    return new DbPool(config);
  if (process.env.NODE_ENV === 'test' && config.dialect === 'test')
    return new DbPool();

  const Clazz = this.get(config.dialect);
  if (Clazz)
    return new Clazz(config);
  else throw new Error(`Driver "${config.dialect}" is not registered`);
};

module.exports = DbPool;
