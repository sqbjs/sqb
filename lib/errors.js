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
const {ErrorEx} = require('errorex');

class SqbError extends ErrorEx {
  /**
   *
   * @param{Error|String} err
   * @param {*} args
   */
  constructor(err, ...args) {
    super(err, ...args);
    if (err instanceof Error)
      this.innerError = err;
  }
}

class AdapterError extends SqbError {
}

/**
 * Expose AdapterError
 */

module.exports = {SqbError, AdapterError};
