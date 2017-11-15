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
const SqlObject = require('./sqlobject');

/**
 * Expose `Raw`.
 */
module.exports = Raw;

/**
 * @param {String} str
 * @constructor
 * @public
 */
function Raw(str) {
  SqlObject.call(this);
  this.type = 'raw';
  this.text = str;
}

Raw.prototype = {
  get isRaw() {
    return this.type === 'raw';
  }
};

Object.setPrototypeOf(Raw.prototype, SqlObject.prototype);
