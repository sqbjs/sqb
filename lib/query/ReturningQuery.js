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
const Query = require('./Query');

/**
 * Expose `ReturningQuery`.
 */
module.exports = ReturningQuery;

/**
 * @constructor
 * @public
 */
function ReturningQuery() {
  Query.apply(this, arguments);
}

Object.setPrototypeOf(ReturningQuery.prototype, Query.prototype);
ReturningQuery.prototype.constructor = ReturningQuery;

ReturningQuery.prototype.returning = function(obj) {
  if (obj) {
    if (typeof obj !== 'object')
      throw new ArgumentError('Object argument required');
    Object.getOwnPropertyNames(obj).forEach(function(k) {
      if (['string', 'number', 'date', 'blob', 'clob']
              .indexOf(obj[k]) < 0)
        throw new ArgumentError('Unknown data type `%s`', obj[k]);
    });
  }
  this._returning = obj;
  return this;
};
