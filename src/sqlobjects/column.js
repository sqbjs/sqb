/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('../interface/sqlobject');

/**
 * @class
 * @public
 */
class Column extends SqlObject {

  constructor(fieldName) {
    super();
    this.type = 'column';
    const m = fieldName.match(/^(?:(\w+)(?:\.))?(\w+) ?(?:as)? ?(\w+)?$/);
    if (!m)
      throw new Error('Invalid definition "' + fieldName + '" for column');
    this.table = m[1];
    this.field = m[2];
    this.alias = m[3];
  }
}

module.exports = Column;
