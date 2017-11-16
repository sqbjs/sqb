/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Module dependencies.
 * @private
 */
const ReturningQuery = require('./ReturningQuery');
const Table = require('../sqlobject/tablename');
const Column = require('../sqlobject/Column');
const isPlainObject = require('putil-isplainobject');

/**
 * Expose `InsertQuery`.
 */

module.exports = InsertQuery;

/**
 * @param {String|Column} column
 * @constructor
 * @public
 */
function InsertQuery(column) {
  ReturningQuery.call(this);
  this.type = 'insert';
  this._columns = [];
  if (column && arguments.length) {
    var cols;
    var values;
    if (isPlainObject(arguments[0])) {
      values = arguments[0];
      cols = Object.getOwnPropertyNames(values);
    } else
      cols = Array.prototype.slice.call(arguments);
    const self = this;
    cols.forEach(function(arg) {
      if (arg)
        self._columns.push(new Column(arg));
      if (values)
        self.values(values);
    });
  }
}

Object.setPrototypeOf(InsertQuery.prototype, ReturningQuery.prototype);

/**
 *
 * @param {string|Raw} table
 * @return {InsertQuery}
 */
InsertQuery.prototype.into = function(table) {
  if (!table) return this;
  this._table = table.isRaw ? table : new Table(String(table));
  return this;
};

/**
 *
 * @param {Array|Object|Raw} values
 * @return {InsertQuery}
 */
InsertQuery.prototype.values = function(values) {
  var out;
  if (!values)
    this._values = undefined;
  else if (values.isRaw || values.type === 'select')
    this._values = values;
  else if (Array.isArray(values)) {
    out = {};
    var i = 0;
    this._columns.forEach(function(key) {
      out[key.field.toUpperCase()] =
          values.length >= i + 1 ? values[i] : null;
      i++;
    });
    this._values = out;

  } else if (typeof values === 'object') {
    // We build a new map of upper keys for case insensitivity
    out = {};
    Object.getOwnPropertyNames(values).forEach(function(key) {
      out[key.toUpperCase()] = values[key];
    });
    this._values = out;

  } else throw new TypeError('Invalid argument');
  return this;
};
