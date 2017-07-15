/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const SqlObject = require('./sqlobject');

/**
 * @class
 * @public
 */

class Order extends SqlObject {

  constructor(value) {
    super();
    this.type = 'order';
    const m = value.match(
        /^([-+])?(?:(\w+)(?:\.))?(\w+) ?(asc|desc|ascending|descending)?$/i);
    if (m) {
      this.table = m[2];
      this.field = m[3];
      if (m[1])
        this.descending = m[1] === '-';
      else if (m[4])
        this.descending = ['desc', 'descending'].includes(m[4].toLowerCase());
    } else
      throw new Error(`Invalid order by definition "${value}"`);
  }
}

module.exports = Order;
