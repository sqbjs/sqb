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
const ArgumentError = require('errorex').ArgumentError;
const promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');
const flattenText = require('putil-flattentext');
const Serializable = require('../Serializable');
const ParamType = require('../enums').ParamType;
const extensions = require('../extensions');

/**
 *
 * @class
 * @abstract
 */
class Query extends Serializable {
  /**
   * @constructor
   * @public
   */
  constructor() {
    super();
    this._hooks = {};
  }

  /**
   * @public
   * @return {boolean}
   */
  get isQuery() {
    return true;
  }

  generate(options, values) {
    const ctx = {};
    if (this.pool && this.pool.config)
      Object.assign(ctx, this.pool.config);
    if (options)
      Object.assign(ctx, options);
    ctx.values = values || {};
    if (this._params)
      Object.assign(ctx.values, this._params);
    /* paramType default COLON */
    ctx.prettyPrint = ctx.prettyPrint || ctx.prettyPrint == null;
    /* prettyPrint default true */
    ctx.extension = extensions.createSerializer(ctx);
    ctx.paramType = ctx.paramType ||
        (ctx.extension && ctx.extension.paramType) || ParamType.COLON;
    ctx.outValues = ctx.outValues ||
        (ctx.paramType === ParamType.QUESTION_MARK ||
        ctx.paramType === ParamType.DOLLAR ? [] : {});
    ctx.serializeHooks = this._hooks['serialize'];

    /* generate sql */
    let sql = this._serialize(ctx);
    sql = flattenText(sql, {noWrap: !ctx.prettyPrint});

    return {
      sql: sql,
      values: ctx.outValues
    };
  }

  /**
   *
   * @param {Object} obj
   * @return {Query}
   * @public
   */
  params(obj) {
    if (typeof obj !== 'object' || Array.isArray(obj))
      throw new ArgumentError('Invalid argument');
    this._params = obj;
    return this;
  }

  /**
   *
   * @param {Object} options
   * @param {Function} [callback]
   * @return {Promise}
   * @public
   */
  then(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    const promise = this.execute(options);
    return callback ? promise.then(callback) : promise;
  }

  /**
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Query}
   * @public
   */
  hook(event, fn) {
    if (typeof event !== 'string')
      throw new ArgumentError('String type required for first argument');
    if (typeof fn !== 'function')
      throw new ArgumentError('Function type required for second argument');
    this._hooks[event] = this._hooks[event] || [];
    this._hooks[event].push(fn);
    return this;
  }

  /**
   *
   * @param {Object} options
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   * @public
   */
  execute(options, callback) {
    const dbobj = this.connection || this.pool;
    if (!dbobj)
      throw new Error('This query is not executable');
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    const self = this;
    if (!callback)
      return promisify.fromCallback((cb) => self.execute(options, cb));

    if (this._hooks['execute']) {
      waterfall(this._hooks['execute'], (err) => {
        if (err)
          return callback(err);
        dbobj.execute.call(dbobj, self, self._params, options, callback);
      });
    } else
      dbobj.execute.call(dbobj, self, self._params, options, callback);
  }

}

/**
 * Expose `Query`.
 */
module.exports = Query;
