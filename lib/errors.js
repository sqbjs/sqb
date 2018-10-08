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
const ErrorEx = require('errorex');

class SqbError extends ErrorEx {
}

class AdapterError extends SqbError {
}

/**
 * Expose
 */

module.exports = {SqbError, AdapterError};
