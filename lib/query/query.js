/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const SqlObject = require('../sqlobjects/sqlobject');
const Serializer = require('../serializer');

/* External module dependencies. */
const assert = require('assert');
const Promisify = require('putil-promisify');

/**
 * @class
 * @public
 */

class Query extends SqlObject {

  //noinspection SpellCheckingInspection
  constructor() {
    super();
  }

  generate(config, values) {
    const serializer = (config && config.isSerializer) ? config :
        new Serializer(config);
    return serializer.generate(this, values);
  }

  action(value) {
    this._action = value;
    return this;
  }

  clientId(value) {
    this._clientId = value;
    return this;
  }

  module(value) {
    this._module = value;
    return this;
  }

  params(obj) {
    assert.ok(!obj || typeof obj === 'object', 'Ivalid argument');
    this._params = obj;
    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  then(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    const promise = this.execute(options);
    return callback ? promise.then(callback) : promise;
  }

  execute(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    if (typeof callback !== 'function')
      callback = undefined;

    const self = this;
    if (!callback)
      return Promisify.fromCallback(cb => self.execute(options, cb));

    if (self.connection)
      return self.connection.execute(this, this._params, options, callback);
    else {
      const dbpool = self.dbpool;
      assert.ok(dbpool, 'This query is not executable');
      options = options || {};
      dbpool.connect((err, conn) => {
        if (err)
          return callback(err);
        try {
          conn.execute(self, this._params, options, (...args) => {
            setImmediate(() => conn.close(
                (err) => {
                  if (err)
                    conn.emit('error', err);
                })
            );
            callback(...args);
          });
        } catch (e) {
          setImmediate(() => conn.close(
              (err) => {
                if (err)
                  conn.emit('error', err);
              })
          );
          callback(e);
        }
      });
    }
  }

}

module.exports = Query;
