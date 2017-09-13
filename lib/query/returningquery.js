/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Query = require('./query');

/* External module dependencies. */
const assert = require('assert');

/**
 * @class
 * @public
 */

class ReturningQuery extends Query {

  returning(obj) {
    if (obj) {
      assert(typeof obj === 'object', 'Object argument required');
      Object.getOwnPropertyNames(obj).forEach(k => {
        assert(['string', 'number', 'date', 'blob', 'clob']
            .includes(obj[k]), 'Unknown data type "' + obj[k] + '"');
      });
    }
    this._returning = obj;
    return this;
  }

}

module.exports = ReturningQuery;
