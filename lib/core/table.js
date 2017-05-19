/**
 * Internal module dependencies.
 */

const SqlObject = require('./abstract');

/**
 * @class
 * @public
 */

class Table extends SqlObject {

    constructor(table) {
        super();
        let m = table.match(/^(?:(\w+)(?:\.))?([\w$]+) ?(?:as)? ?(\w+)?$/);
        if (!m)
            throw new Error(`Invalid table definition "${table}"`);
        this.type = 'table';
        this.schema = m[1];
        this.table = m[2];
        this.alias = m[3];
    }

}

module.exports = Table;