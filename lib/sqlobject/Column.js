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
const SqlObject = require('./SqlObject');

/**
 * Expose `Column`.
 */
module.exports = Column;

/**
 * @param {String} fieldName
 * @constructor
 * @public
 */
function Column(fieldName) {
  SqlObject.call(this);
  this.type = 'column';
  const m = fieldName.match(/^(?:(\w+)(?:\.))?(\*|\w+) *(?:as)? *(\w+)?$/);
  if (!m)
    throw new ArgumentError('Invalid value (%s) for `fieldName` argument', fieldName);
  this.table = m[1];
  this.field = m[2];
  this.alias = m[2] !== '*' ? m[3] : '';
}

Object.setPrototypeOf(Column.prototype, SqlObject.prototype);

