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
const debug = require('debug')('sqb:Connection');
const merge = require('putil-merge');
const {AdapterError} = require('../errors');
const Cursor = require('./Cursor');
const normalizeRows = require('../helper/normalizeRows');
const waterfall = require('putil-waterfall');

/**
 *
 * @class
 */
class PreparedQuery {

  /**
   * @param {Connection} connection
   * @param {String|Query} query
   * @param {Object} options
   * @constructor
   * @public
   */
  constructor(connection, query, options) {
    this.connection = connection;
    this.onExecute = [];
    this.onFetch = [];
    this.query = {sql: null};

    options = options || {};
    const defaults = this.pool.config.defaults;

    this.options = {
      autoCommit: options.autoCommit != null ? options.autoCommit :
          defaults.autoCommit,
      cursor: options.cursor != null ? options.cursor : defaults.cursor,
      objectRows: options.objectRows != null ? options.objectRows :
          (defaults.objectRows != null ? defaults.objectRows : true),
      ignoreNulls: options.ignoreNulls != null ?
          options.ignoreNulls : defaults.ignoreNulls,
      fetchRows: options.fetchRows != null ?
          options.fetchRows : defaults.fetchRows,
      naming: options.naming || defaults.naming,
      fetchAsString: Array.isArray(options.fetchAsString) ? options.fetchAsString :
          (options.fetchAsString ? [options.fetchAsString] : undefined),
      showSql: options.showSql != null ? options.showSql : defaults.showSql,
      action: options.action
    };
    this.options.ignoreNulls =
        this.options.objectRows && this.options.ignoreNulls;

    if (typeof query === 'object' &&
        typeof query.generate === 'function') {
      let o = merge.clone(this.pool.config);
      o.values = query.values;
      o.prettyPrint = options.prettyPrint != null ? options.prettyPrint :
          (defaults.prettyPrint != null ? defaults.prettyPrint : true);
      o = query.generate(o, false);
      this.query.sql = o.sql;
      if (o.values)
        this.query.values = o.values;
      if (o.returningParams)
        this.query.returningParams = o.returningParams;
      if (this.options.fetchRows == null)
        this.options.fetchRows = query._limit;
      if (this.options.action === null)
        this.options.action = query._action;
      if (query.listenerCount('execute'))
        this.onExecute.push(...query.listeners('execute'));
      if (query.listenerCount('fetch')) {
        this.onFetch.push(...query.listeners('fetch'));
      }
    } else {
      this.query.sql = String(query);
      if (options.values)
        this.query.values = options.values;
      if (options.returningParams)
        this.query.returningParams = options.returningParams;
    }

    if (this.options.fetchRows == null)
      this.options.fetchRows = 100;

    for (const key of Object.getOwnPropertyNames(this.options)) {
      if (this.options[key] == null)
        delete this.options[key];
    }

  }

  get pool() {
    return this.connection.pool;
  }

  execute() {
    const startTime = Date.now();
    const conn = this.connection;
    /* istanbul ignore next */
    if (process.env.DEBUG)
      debug('[%s] execute | %o', conn.sessionId, this.options);
    conn.emitSafe('execute', this.options);

    /* Keep connection alive */
    conn.acquire();
    /* Call execute hooks */
    return this.callExecuteHooks().then(() => {
      /* Execute query */
      return new Promise((resolve, reject) => {
        conn._client.execute(this.query, this.options, (err, response) => {
          try {
            if (err) {
              err = new AdapterError(err);
              err.query = this.query;
              err.options = this.options;
              return reject(err);
            }
            if (!response)
              return reject(new AdapterError('Database adapter returned empty response'));

            const result = {
              executeTime: Date.now() - startTime
            };

            const fields = {};
            /* istanbul ignore else */
            if (response.fields) {
              let i = 0;
              for (const f of response.fields) {
                fields[f.name] = merge({index: i++}, f);
                delete fields[f.name].name;
              }
              response.fields = fields;
            }

            if (response.cursor) {
              result.cursor = new Cursor(this, response);

            } else if (response.rows) {
              /* Normalize rows */
              normalizeRows(response.rows, this.options);
              this.callFetchHooks(response.rows);
              result.fields = response.fields;
              result.rows = response.rows;
            } else if (response.returns)
              result.returns = response.returns;

            if (this.options.showSql) {
              result.query = this.query;
              result.options = this.options;
            }

            resolve(result);

          } catch (e) {
            reject(e);
          }
        });
      });
    }).finally(() => conn.release());
  }

  callExecuteHooks() {
    return new Promise((resolve, reject) => {
      waterfall.every(this.onExecute, (next, fn) => {
        return Promise.try(() => fn(this.query, this.options));
      }, (err) => {
        if (err)
          reject(err);
        resolve();
      });
    });
  }

  callFetchHooks(rows) {
    for (const row of rows) {
      for (const fn of this.onFetch)
        fn(row, this.options);
    }
  }

}

/**
 * Expose `PreparedQuery`.
 */
module.exports = PreparedQuery;
