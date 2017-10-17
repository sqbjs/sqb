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
const Promisify = require('putil-promisify');
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
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  if (typeof callback !== 'function')
    callback = undefined;

  const self = this;
  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.execute(options, cb);
    });

  if (self.connection)
    return self.connection.execute(this, this._params, options, callback);
  else {
    const dbpool = self.dbpool;
    if (!dbpool)
      throw new Error('This query is not executable');
    options = options || {};
    dbpool.connect(function(err, conn) {
      if (err)
        return callback(err);
      try {
        conn.execute(self, self._params, options, function() {
          setImmediate(function() {
            conn.close(
                function(err) {
                  if (err)
                    conn.emit('error', err);
                });
          });
          callback.apply(null, arguments);
        });
      } catch (e) {
        setImmediate(function() {
          conn.close(
              function(err) {
                if (err)
                  conn.emit('error', err);
              });
        });
        callback(e);
      }
    });
  }
};

