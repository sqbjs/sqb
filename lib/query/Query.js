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
const EventEmitter = require('events');
const {ArgumentError} = require('errorex');
const flattenText = require('putil-flattentext');
const Serializable = require('../Serializable');
const ParamType = require('../enums').ParamType;
const extensions = require('../extensions');
const aggregation = require('../helper/aggregation');
const merge = require('putil-merge');

/**
 *
 * @class
 * @abstract
 */
class Query extends aggregation(Serializable, EventEmitter) {

  /**
   * @constructor
   * @public
   */
  constructor() {
    super();
    this._dbobj = null;
    this._action = null;
  }

  /**
   * Returns Pool instance
   * @return {Pool}
   */
  get pool() {
    return this._dbobj && this._dbobj.pool ?
        this._dbobj.pool : this._dbobj;
  }

  /**
   * @public
   * @return {boolean}
   */
  get isQuery() {
    return true;
  }

  /**
   *
   * @param {Object} [options]
   * @return {Promise}
   * @public
   */
  execute(options) {
    if (!this._dbobj)
      throw new Error('This query is not executable');
    return this._dbobj.execute(this, options);
  }

  /**
   *
   * @param {Object} [options]
   * @param {Boolean} [options.prettyPrint=true]
   * @param {Integer} [options.paramType=0]
   * @param {Object|Array} [options.values]
   * @param {Boolean} [mergePoolConfig=true]
   * @return {{sql, values}}
   */
  generate(options, mergePoolConfig) {
    const ctx = {};
    const pool = this.pool;
    if ((mergePoolConfig || mergePoolConfig == null) &&
        pool && pool.config.defaults)
      merge.deep(ctx, pool.config.defaults);
    if (options)
      merge.deep(ctx, options);
    ctx.values = ctx.values || this._values || {};
    /* create serialization extension */
    ctx.extension = extensions.createSerializer(ctx);
    /* prettyPrint default true */
    ctx.prettyPrint = ctx.prettyPrint || ctx.prettyPrint == null;
    /* paramType default COLON */
    ctx.paramType = ctx.paramType != null ? ctx.paramType :
        (ctx.extension && ctx.extension.paramType !=
        null ? ctx.extension.paramType :
            ParamType.COLON);
    ctx.outValues = ctx.outValues ||
        (ctx.paramType === ParamType.QUESTION_MARK ||
        ctx.paramType === ParamType.DOLLAR ? [] : {});
    ctx.serializeHooks = this.listeners('serialize');
    /* generate output */
    const sql = this._serialize(ctx);
    return {
      sql: flattenText(sql, {noWrap: !ctx.prettyPrint}),
      values: ctx.outValues
    };
  }

  /**
   *
   * @param {Object} obj
   * @return {Query}
   * @public
   */
  values(obj) {
    if (typeof obj !== 'object' || Array.isArray(obj))
      throw new ArgumentError('Invalid argument');
    this._values = obj;
    return this;
  }

}

/**
 * Expose `Query`.
 */
module.exports = Query;
