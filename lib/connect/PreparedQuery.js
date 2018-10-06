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
          connection.autoCommit,
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
      o.values = options.values;
      o.prettyPrint = options.prettyPrint != null ? options.prettyPrint :
          (defaults.prettyPrint != null ? defaults.prettyPrint : true);
      /* Generate sql */
      o = query.generate(o, false);
      this.query.sql = o.sql;
      if (o.values)
        this.query.values = o.values;
      if (o.is)
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
    conn.emitSafe('execute', conn, this.options);

    /* Keep connection alive */
    conn.acquire();
    /* Call execute hooks */
    return this.callExecuteHooks(conn).then(() => {
      /* Execute query */

      return conn._client.execute(this.query, this.options).then(response => {

        if (!response)
          throw new AdapterError('Database adapter returned empty response');

        const result = {
          executeTime: Date.now() - startTime
        };

        /* istanbul ignore else */
        if (response.fields && response.fields.length) {
          const fields = {};
          let i = 0;
          for (const f of response.fields) {
            const name = f.name &&
                (this.options.naming === 'lowercase' ? f.name.toLowerCase() :
                    (this.options.naming === 'uppercase' ?
                        f.name.toUpperCase() : f.name));
            fields[name] = merge({index: i++}, f);
            delete fields[name].name;
          }
          response.fields = fields;
        } else
          delete response.fields;

        if (response.cursor) {
          result.cursor = new Cursor(this, response);

        } else if (response.rows && response.rows.length) {
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

        return result;

      }).catch(err => {
        err = new AdapterError(err);
        err.query = this.query;
        err.options = this.options;
        throw err;
      });
    }).finally(() => conn.release());
  }

  callExecuteHooks(conn) {
    return waterfall.every(this.onExecute, (next, fn) => {
      return Promise.try(() => fn(conn, this.query, this.options));
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
