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
const Serializable = require('../Serializable');

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
  Serializable.call(this);
  this.type = 'raw';
  this.text = str;
}

Raw.prototype = {
  get isRaw() {
    return true;
  }
};

Object.setPrototypeOf(Raw.prototype, Serializable.prototype);

Raw.prototype._serialize = function(ctx) {
  const self = this;
  return Serializable.serializeFallback(ctx, 'raw', self.text, function() {
    return self.text;
  });
};
