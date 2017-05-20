/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('./abstract');

/**
 * @class
 * @public
 */

class Order extends SqlObject {

    constructor(value) {
        super();
        this.type = 'order';
        let m = value.match(/^(?:(\w+)(?:\.))?(\w+) ?(asc|desc|ascending|descending)?$/i);
        if (m) {
            this.table = m[1];
            this.field = m[2];
            if (m[3])
                this.descending = ['desc', 'descending'].indexOf(m[3].toLowerCase()) >= 0;
        } else
            throw new Error(`Invalid order by definition "${value}"`);
    }

    get isOrder() {
        return true;
    }

}

module.exports = Order;