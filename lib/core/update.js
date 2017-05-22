/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('./abstract');
const Table = require('./tablename');


/**
 * @class
 * @public
 */

class Update extends SqlObject {

    constructor(table, values) {
        super();
        this.type = 'update';
        this._values = {};
        this._table = table.isRaw ? table : new Table(String(table));
        this.set(values);
        this.clearWhere();
    }

    /**
     *
     * @return {Update}
     * @public
     */
    clearWhere() {
        this._where = new ConditionGroup();
        return this;
    }

    /**
     *
     * @param {Object|Raw} values
     * @return {Update}
     * @public
     */
    set(values) {
        if (!values) return this;
        if (values.isRaw)
            this._values = values;
        if (typeof values === 'object') {
            // We build a new map of upper keys for case insensitivity
            let out = {};
            Object.getOwnPropertyNames(values).forEach(
                function (key) {
                    out[key.toUpperCase()] = values[key];
                }
            );
            this._values = out;
        } else throw new TypeError('Invalid argument');
        return this;
    }

    /**
     *
     * @param {Condition} conditions..
     * @return {Update}
     * @public
     */
    where(conditions) {
        if (!conditions) return this;
        this._where.add.apply(this._where, arguments);
        return this;
    }


}

module.exports = Update;