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

const MetaDataSelect = require('./MetaDataSelect');
const promisify = require('putil-promisify');

/**
 * Expose `MetaData`.
 */

module.exports = MetaData;

/**
 * @param {Object} driver
 * @constructor
 */
function MetaData(dbObj, driver) {
  if (!driver.metaData)
    throw new Error('Driver of "' + this.dialect +
        '" dialect does not support MetaData operations');
  this._dbObj = dbObj;
  this._driver = driver;
}

MetaData.prototype.query = function(request, callback) {
  const self = this;
  if (typeof request === 'function') {
    callback = request;
    request = undefined;
  }
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.query(request, cb);
    });

  request = request || {};

  // Validate request
  if (this._driver.supportSchemas) {
    const schemas = request.schemas = request.schemas || '*';
    if (schemas !== '*') {
      if (typeof schemas !== 'object' ||
          Array.isArray(schemas))
        throw new TypeError('Object instance required for request.schemas');
      Object.getOwnPropertyNames(schemas).forEach(function(schemaName) {
        var schema = schemas[schemaName];
        var tables = schema.tables = schema.tables || '*';
        if (tables !== '*') {
          if (!Array.isArray(tables))
            throw new TypeError('Array instance required for [schema].tables');
        }
      });
    }
  } else {
    const tables = request.tables = request.tables || '*';
    if (tables !== '*') {
      if (!Array.isArray(tables))
        throw new TypeError('Array instance required for request.tables');
    }
  }

  this._driver.metaData.query(this._dbObj, request, callback);
};
