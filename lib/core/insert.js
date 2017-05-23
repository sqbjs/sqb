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
const Column = require('./column');


/**
 * @class
 * @public
 */

class Insert extends SqlObject {

    constructor() {
        super();
        this.type = 'insert';
        this._columns = [];
    }

    /**
     *
     * @param {string|Raw} columns..
     * @return {Insert}
     */
    columns(columns) {
        if (!columns) return this;
        for (let i = 0; i < arguments.length; i++)
            this._columns.push(new Column(arguments[i]));
        return this;
    }

    /**
     *
     * @param {string|Raw} table
     * @return {Insert}
     */
    into(table) {
        if (!table) return this;
        this._table = table.isRaw ? table : new Table(String(table));
        return this;
    }

    /**
     *
     * @param {Array|Object|Raw} values
     * @return {Insert}
     */
    values(values) {
        if (!values)
            this._values = undefined;
        else if (values.isRaw || values.isSelect)
            this._values = values;
        else if (Array.isArray(values)) {
            let out = {}, i = 0;
            this._columns.forEach(function (key) {
                out[key.field.toUpperCase()] = values.length >= i ? values[i] : null;
                i++;
            });
            this._values = out;
        } else if (typeof values === 'object') {
            // We build a new map of upper keys for case insensitivity
            let out = {};
            Object.getOwnPropertyNames(values).forEach(
                function (key) {
                    out[key.toUpperCase()] = values[key];
                }
            );
            this._values = out;
        }
        else throw new TypeError('Invalid argument');
        return this;
    }


}

module.exports = Insert;