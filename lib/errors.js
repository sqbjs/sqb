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
const errorex = require('errorex');
const ErrorEx = errorex.ErrorEx;

/**
 * Expose Module
 */

module.exports = {
  SqlError: SqlError
};

function SqlError() {
  ErrorEx.apply(this, arguments);
}

SqlError.prototype = Object.create(ErrorEx.prototype);
SqlError.prototype.constructor = SqlError;
