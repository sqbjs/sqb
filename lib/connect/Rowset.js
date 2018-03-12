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
const EventEmitter = require('events').EventEmitter;
const FieldCollection = require('./FieldCollection');
const RowsetStream = require('./RowsetStream');
const Row = require('./Row');

/**
 * @class
 */
class Rowset extends EventEmitter {
  /**
   *
   * @param {Array} rows
   * @param {Object} fields
   * @param {Object} options
   * @constructor
   */
  constructor(rows, fields, options) {
    super();
    fields = new FieldCollection(fields, options);
    rows.forEach((row, i) => {
      rows[i] = new Row(row, fields);
      /* Call fetchEvents events if exists */
      if (options.fetchEvents && options.fetchEvents.length)
        options.fetchEvents.forEach((cb) => cb(rows[i]));
    });
    this._fields = fields;
    this._ignoreNulls = options.ignoreNulls;
    this._naming = options.naming;
    this._objectRows = ((rows && rows.length &&
        typeof rows[0] === 'object' &&
        !Array.isArray(rows[0])) ||
        /* istanbul ignore next */
        options.objectRows);
    this._rows = rows;
    this._rowNum = 0;
    this._fetchedRows = 0;
  }

  /**
   * Returns if rowNum is before first record.
   *
   * @return {boolean}
   */
  get isBof() {
    return this._rowNum === 0;
  }

  /**
   * Returns if rowNum is after last record.
   *
   * @return {boolean}
   */
  get isEof() {
    return this._rowNum > this.length;
  }

  /**
   * Returns number of fetched record count from database.
   *
   * @return {number}
   */
  get length() {
    return this._rows.length;
  }

  /**
   * Returns FieldCollection instance which contains information about fields.
   *
   * @return {Object|*}
   */
  get fields() {
    return this._fields;
  }

  /**
   *  Returns current record. If query executed with objectRows=true option,
   *  this property returns object that contains field name/value pairs,
   *  otherwise it returns array of values.
   *
   * @return {*}
   */
  get row() {
    return this._rows[this.rowNum - 1];
  }

  /**
   * Returns rows array
   *
   * @return {Array}
   */
  get rows() {
    return this._rows;
  }

  /**
   * Gets or sets current row number. Note that first record number is 1.
   * @return {Int}
   */
  get rowNum() {
    return this._rowNum;
  }

  /**
   *
   * @param {Int} value
   */
  set rowNum(value) {
    const k = Math.min(Math.max(value || 0, 0), this.length + 1);
    if (this._rowNum !== k) {
      this._rowNum = k;
      this.emit('move', k);
    }
  }

  /**
   * Returns value of given field name of current record.
   *
   * @param {String} name
   * @return {*}
   */
  get(name) {
    if (this.rowNum < 1)
      throw new Error('BOF error');
    if (this.rowNum > this.length)
      throw new Error('EOF error');
    return this.row && this.row.get(name);
  }

  /**
   * Updates value of given field name of current record.
   *
   * @param {Object} name
   * @param {*} value
   * @return {Rowset}
   */
  set(name, value) {
    if (this.rowNum < 1)
      throw new Error('BOF error');
    if (this.rowNum > this.length)
      throw new Error('EOF error');
    this.row && this.row.set(name, value);
    return this;
  }

  /**
   * Returns the iterator
   *
   * @return {Object}
   */
  iterator() {
    this.reset();
    return {
      next: () => ({value: this.next(), done: this.isEof})
    };
  }

  /**
   * Moves rowset to given row number and returns new row number
   *
   * @param {Int} rowNum
   * @return {Int}
   */
  moveTo(rowNum) {
    this.rowNum = rowNum;
    return this.rowNum;
  }

  /**
   * Moves rowset forward by one row and return that row.
   *
   * @return {Array|Object}
   */
  next() {
    if (this.isEof)
      return undefined;
    this._rowNum++;
    return this.row;
  }

  /**
   * Moves rowset back by one row and return that row.
   *
   * @return {Array|Object}
   */
  prev() {
    if (this.isBof)
      return undefined;
    this._rowNum--;
    return this.row;
  }

  /**
   * Sets rowNum to 0.
   *
   */
  reset() {
    this._rowNum = 0;
  }

  /**
   * Increases or decreases rowNum by given step.
   *
   * @param {Int} step
   * @return {number}
   */
  seek(step) {
    const k = this.rowNum;
    this.rowNum += step;
    return this.rowNum - k;
  }

  /**
   * Creates and returns a readable stream.
   *
   * @param {Object} [options]
   * @param {Boolean} [options.objectMode]
   * @param {Int} [options.outFormat]
   * @param {Function} [options.stringify]
   * @return {RowsetStream}
   */
  toStream(options) {
    return new RowsetStream(this, options);
  }

  toJSON() {
    return {
      fields: this.fields.toObject(),
      rows: this.rows,
      numRows: this.rows.length,
      eof: true
    };
  }

  toString() {
    return '[object Rowset]';
  }

  inspect() {
    return this.toString();
  }

}

/**
 * Expose `Rowset`.
 */

module.exports = Rowset;

/**
 * Returns the iterator object contains rows
 *
 * @return {Object} - Returns the iterator object contains rows
 */
Rowset.prototype[Symbol.iterator] = Rowset.prototype.iterator;
