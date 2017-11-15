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
const SqlObject = require('./sqlobject');

/**
 * Expose `Order`.
 */
module.exports = Order;

/**
 * @param {String} value
 * @constructor
 * @public
 */
function Order(value) {
  SqlObject.call(this);
  this.type = 'order';
  const m = value.match(
      /^([-+])?(?:(\w+)(?:\.))?(\w+) ?(asc|desc|ascending|descending)?$/i);
  if (m) {
    this.table = m[2];
    this.field = m[3];
    if (m[1])
      this.descending = m[1] === '-';
    else if (m[4])
      this.descending = ['desc', 'descending'].indexOf(m[4].toLowerCase()) >= 0;
  } else
    throw new ArgumentError('Invalid order by definition (%s)', value);
}

Object.setPrototypeOf(Order.prototype, SqlObject.prototype);
