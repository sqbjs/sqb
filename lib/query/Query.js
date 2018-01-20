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
const defineConst = require('putil-defineconst');
const flattenText = require('putil-flattentext');
const Serializable = require('../Serializable');
const ParamType = require('../enums').ParamType;
const extensions = require('../extensions');

/**
 * Expose `Query`.
 */
module.exports = Query;

/**
 * @constructor
 * @public
 */
function Query() {
  Serializable.call(this);
  defineConst(this, {
    _hooks: {}
  }, false);
}

Query.prototype = {
  get isQuery() {
    return true;
  }
};
Object.setPrototypeOf(Query.prototype, Serializable.prototype);
Query.prototype.constructor = Query;

Query.prototype.generate = function(options, values) {
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

  /* generate sql */
  var sql = this._serialize(ctx);
  sql = flattenText(sql, {noWrap: !ctx.prettyPrint});

  return {
    sql: sql,
    values: ctx.outValues
  };
};

Query.prototype.params = function(obj) {
  if (typeof obj !== 'object' || Array.isArray(obj))
    throw new ArgumentError('Invalid argument');
  this._params = obj;
  return this;
};

Query.prototype.then = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  const promise = this.execute(options);
  return callback ? promise.then(callback) : promise;
};

Query.prototype.hook = function(event, fn) {
  if (typeof event !== 'string')
    throw new ArgumentError('String type required for first argument');
  if (typeof fn !== 'function')
    throw new ArgumentError('Function type required for second argument');
  this._hooks[event] = this._hooks[event] || [];
  this._hooks[event].push(fn);
  return this;
};

Query.prototype.execute = function(options, callback) {
  const dbobj = this.connection || this.pool;
  if (!dbobj)
    throw new Error('This query is not executable');
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.execute(options, cb);
    });
  if (this._hooks['execute']) {
    waterfall(this._hooks['execute'], function(err) {
      if (err)
        return callback(err);
      dbobj.execute.call(dbobj, self, self._params, options, callback);
    });
  } else
    dbobj.execute.call(dbobj, self, self._params, options, callback);
};

/* istanbul ignore next*/
/**
 * @param {Object} ctx
 * @abstract
 * @return {String}
 */
Query.prototype._serialize = function(ctx) {
  return '';
};

