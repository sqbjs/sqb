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

class TableName extends SqlObject {

    constructor(table) {
        super();
        const m = table.match(/^(?:(\w+)(?:\.))?([\w$]+) ?(?:as)? ?(\w+)?$/);
        if (!m)
            throw new Error(`Invalid table definition "${table}"`);
        this.type = 'table';
        this.schema = m[1];
        this.table = m[2];
        this.alias = m[3];
    }

}

module.exports = TableName;