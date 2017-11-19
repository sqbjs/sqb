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
const ArgumentError = require('errorex').ArgumentError;
const FieldCollection = require('./FieldCollection');
const RowsetStream = require('./RowsetStream');

/**
 * Expose `Rowset`.
 */

module.exports = Rowset;

/**
 *
 * @param {Array} rows
 * @param {Object} fields
 * @param {Object} options
 * @constructor
 */
function Rowset(rows, fields, options) {
  EventEmitter.call(this);
  this._fields = new FieldCollection(fields, options);
  this._ignoreNulls = options.ignoreNulls;
  this._naming = options.naming;
  this._objectRows = ((rows && rows.length &&
      typeof rows[0] === 'object' &&
      !Array.isArray(rows[0])) || options.objectRows);
  this._rowNum = 0;
  this._rows = rows;

}

Rowset.prototype = {

  get isBof() {
    return this._rowNum === 0;
  },

  get isEof() {
    return this._rowNum > this.length;
  },

  get length() {
    return this._rows.length;
  },

  get fields() {
    return this._fields;
  },

  get row() {
    return this._rows[this.rowNum - 1];
  },

  get rows() {
    return this._rows;
  },

  get rowNum() {
    return this._rowNum;
  },

  set rowNum(value) {
    const k = this._rowNum =
        Math.min(Math.max(value || 0, 0), this.length + 1);
    this._rowNum = k;
    if (this._rowNum !== k)
      this._emitSafe('move', k);
  }
};
Object.setPrototypeOf(Rowset.prototype, EventEmitter.prototype);
Rowset.prototype.constructor = Rowset;

Rowset.prototype.get = function(name) {
  const f = this._fields.get(name);
  if (!f)
    throw new ArgumentError('Field `%s` not found', name);
  const row = this.row;
  if (!row)
    return undefined;
  if (Array.isArray(row)) {
    return f.index < row.length ? row[f.index] : null;
  } else
    return row[f.name] || null;
};

Rowset.prototype.set = function(name, value) {
  const f = this._fields.get(name);
  if (!f)
    throw new ArgumentError('Field `%s` not found', name);
  if (this.isBof)
    throw new ArgumentError('BOF error');
  if (this.isEof)
    throw new ArgumentError('EOF error');

  const row = this.row;
  if (Array.isArray(row)) {
    while (row.length < f.index + 1)
      row.push(null);
    row[f.index] = value;
  } else {
    row[f.name] = value;
  }
  return this;
};

Rowset.prototype.moveTo = function(rowNum) {
  this.rowNum = rowNum;
  return this.rowNum;
};

Rowset.prototype.next = function() {
  if (this.isEof)
    return undefined;
  this._rowNum++;
  return this.row;
};

Rowset.prototype.prev = function() {
  if (this.isBof)
    return undefined;
  this._rowNum--;
  return this.row;
};

Rowset.prototype.reset = function() {
  this._rowNum = 0;
};

Rowset.prototype.seek = function(step) {
  var k = this.rowNum;
  this.rowNum += step;
  return this.rowNum - k;
};

Rowset.prototype.toStream = function(options) {
  return new RowsetStream(this, options);
};

Rowset.prototype.toJSON = function() {
  return {
    fields: this.fields.toObject(),
    rows: this.rows,
    numRows: this.rows.length,
    eof: true
  };
};

