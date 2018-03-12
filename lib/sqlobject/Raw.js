/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const Serializable = require('../Serializable');

/**
 *
 * @class
 */
class Raw extends Serializable {
  /**
   * @param {String} str
   * @constructor
   * @public
   */
  constructor(str) {
    super();
    this.type = 'raw';
    this.text = str;
    this.isRaw = true;
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    return Serializable.serializeFallback(ctx, 'raw', this.text, () => {
      return this.text;
    });
  }

}

/**
 * Expose `Raw`.
 */
module.exports = Raw;
