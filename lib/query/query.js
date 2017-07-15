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
const Promisify = require('putil-promisify');

/* External module dependencies. */
const assert = require('assert');

/**
 * @class
 * @public
 */

class Query extends SqlObject {

  //noinspection SpellCheckingInspection
  constructor() {
    super();
  }

  build(config, params) {
    if (config instanceof Serializer) {
      return config.build(this, params);
    } else
      return Serializer.create(config)
          .build(this, params);
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
    const self = this;
    const promise = Promisify.fromCallback(cb => self.execute(options, cb));
    return callback ? promise.then(callback) : promise;
  }

  execute(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    const self = this;
    if (self.connection)
      return self.connection.execute(this, this._params, options, callback);
    else {
      const dbpool = self.dbpool;
      assert.ok(dbpool, 'This query is not executable');
      options = options || {};
      dbpool.connect((err, conn) => {
        if (err) {
          callback(err);
          return;
        }
        try {
          conn.execute(self, this._params, options, (...args) => {
            conn.close();
            callback(...args);
          });
        } catch (e) {
          conn.close();
          callback(e);
        }
      });
    }
  }

}

module.exports = Query;
