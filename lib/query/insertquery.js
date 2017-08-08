/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Query = require('./query');
const Table = require('../sqlobjects/tablename');
const Column = require('../sqlobjects/column');

/* External module dependencies. */
const isPlainObject = require('putil-isplainobject');
const assert = require('assert');

/**
 * @class
 * @public
 */

class InsertQuery extends Query {

  constructor(...columns) {
    super();
    this.type = 'insert';
    this._columns = [];
    if (columns.length) {
      let cols = columns;
      let values;
      if (isPlainObject(columns[0])) {
        values = columns[0];
        cols = Object.getOwnPropertyNames(values);
      }
      for (const arg of cols)
        if (arg)
          this._columns.push(new Column(arg));
      if (values)
        this.values(values);
    }
  }

  /**
   *
   * @param {string|Raw} table
   * @return {InsertQuery}
   */
  into(table) {
    if (!table) return this;
    this._table = table.isRaw ? table : new Table(String(table));
    return this;
  }

  /**
   *
   * @param {Array|Object|Raw} values
   * @return {InsertQuery}
   */
  values(values) {
    if (!values)
      this._values = undefined;
    else if (values.isRaw || values.type === 'select')
      this._values = values;
    else if (Array.isArray(values)) {
      const out = {};
      let i = 0;
      for (const key of this._columns) {
        out[key.field.toUpperCase()] =
            values.length >= i + 1 ? values[i] : null;
        i++;
      }
      this._values = out;

    } else if (typeof values === 'object') {
      // We build a new map of upper keys for case insensitivity
      const out = {};
      Object.getOwnPropertyNames(values).forEach(key => {
            out[key.toUpperCase()] = values[key];
          }
      );
      this._values = out;

    } else throw new TypeError('Invalid argument');
    return this;
  }

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

module.exports = InsertQuery;
