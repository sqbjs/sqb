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
const SqlObject = require('../sqlobjects/sqlobject');
const Serializer = require('../serializer');

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

const proto = Query.prototype = {};
Object.setPrototypeOf(proto, SqlObject.prototype);
proto.constructor = Query;

proto.generate = function(config, values) {
  const serializer = (config && config.isSerializer) ? config :
      new Serializer(config);
  return serializer.generate(this, values);
};

proto.action = function(value) {
  this._action = value;
  return this;
};

proto.clientId = function(value) {
  this._clientId = value;
  return this;
};

proto.module = function(value) {
  this._module = value;
  return this;
};

proto.params = function(obj) {
  if (typeof obj !== 'object')
    throw new ArgumentError('Invalid argument');
  this._params = obj;
  return this;
};

proto.then = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  const promise = this.execute(options);
  return callback ? promise.then(callback) : promise;
};

proto.execute = function(options, callback) {
  const dbobj = this.connection || this.dbpool;
  if (!dbobj)
    throw new Error('This query is not executable');
  return dbobj.execute.apply(dbobj, [this,
    this._params].concat(Array.prototype.slice.call(arguments)));
};

