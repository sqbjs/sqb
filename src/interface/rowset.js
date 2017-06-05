/* SQB-connect
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */


/* Internal module dependencies. */
const promisify = require('../helpers/promisify');

/* External module dependencies. */
const debug = require('debug')('sqb:RowSet');

/**
 * @class
 * @public
 */

class RowSet {

  constructor(connection) {
    this._connection = connection;
    connection.acquire();
  }

  get connection() {
    return this._connection;
  }

  close() {
    this._connection.close();
  }

  next(callback) {

  }

}

module.exports = RowSet;
