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
const SqlObject = require('../sqlobject/SqlObject');
const Serializer = require('../Serializer');

/**
 * Expose `Query`.
 */
module.exports = Query;

/**
 * @constructor
 * @public
 */
function Query() {
  SqlObject.call(this);
}

Object.setPrototypeOf(Query.prototype, SqlObject.prototype);
Query.prototype.constructor = Query;

Query.prototype.generate = function(config, values) {
  const serializer = (config && config.isSerializer) ? config :
      new Serializer(config);
  return serializer.generate(this, values);
};

Query.prototype.action = function(value) {
  this._action = value;
  return this;
};

Query.prototype.clientId = function(value) {
  this._clientId = value;
  return this;
};

Query.prototype.module = function(value) {
  this._module = value;
  return this;
};

Query.prototype.params = function(obj) {
  if (typeof obj !== 'object')
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

Query.prototype.execute = function(options, callback) {
  const dbobj = this.connection || this.pool;
  if (!dbobj)
    throw new Error('This query is not executable');
  return dbobj.execute.apply(dbobj, [this,
    this._params].concat(Array.prototype.slice.call(arguments)));
};

