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

    constructor(table, values) {
        super();
        this.type = 'insert';
        this._columns = [];
        this.into(table);
        this.values(values);
    }

    columns(columns) {
        if (arguments.length === 0 || !columns) return this;
        for (let i = 0; i < arguments.length; i++) {
            let col;
            if (arguments[i] instanceof RegExp) {
                col = new Column(arguments[i].source);
                col.isParam = true;
            } else
                col = new Column(String(arguments[i]));
            this._columns.push(col);
        }
        return this;
    }

    into(table) {
        if (!table) return this;
        this._table = table.isRaw ? table : new Table(String(table));
        return this;
    }

    values(values) {
        if (!values)
            this._values = undefined;
        else if (values.isRaw || values.isSelect)
            this._values = values;
        else if (typeof values === 'object') {
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