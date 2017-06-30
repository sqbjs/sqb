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

/**
 * @class
 * @public
 */

class InsertQuery extends Query {

  constructor(dbpool, ...columns) {
    super(dbpool);
    this.type = 'insert';
    this._columns = [];
    if (columns.length)
      this.columns(...columns);
  }

  /**
   *
   * @param {string|Raw} columns
   * @return {InsertQuery}
   */
  columns(...columns) {
    for (const arg of columns)
      if (arg)
        this._columns.push(new Column(arg));
    return this;
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
        out[key.field.toUpperCase()] = values.length >= i+1 ? values[i] : null;
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

}

module.exports = InsertQuery;
