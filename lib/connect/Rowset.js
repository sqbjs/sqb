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
const defineConst = require('putil-defineconst');
const FieldCollection = require('./FieldCollection');
const RowsetStream = require('./RowsetStream');
const Row = require('./Row');

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
  fields = new FieldCollection(fields, options);
  rows.forEach(function(row, i) {
    rows[i] = new Row(row, fields);
    /* Call fetchEvents events if exists */
    if (options.fetchEvents && options.fetchEvents.length)
      options.fetchEvents.forEach(function(cb) {
        cb(rows[i]);
      });
  });
  defineConst(this, {
    _fields: fields,
    _ignoreNulls: options.ignoreNulls,
    _naming: options.naming,
    _objectRows: ((rows && rows.length &&
        typeof rows[0] === 'object' &&
        !Array.isArray(rows[0])) || options.objectRows),
    _rows: rows
  }, false);
  defineConst(this, {
    _rowNum: 0,
    _fetchedRows: 0
  }, {
    writable: true,
    enumerable: false
  });
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
    const k = Math.min(Math.max(value || 0, 0), this.length + 1);
    if (this._rowNum !== k) {
      this._rowNum = k;
      this.emit('move', k);
    }
  }
};
Object.setPrototypeOf(Rowset.prototype, EventEmitter.prototype);
Rowset.prototype.constructor = Rowset;

Rowset.prototype.get = function(name) {
  if (this.rowNum < 1)
    throw new Error('BOF error');
  if (this.rowNum > this.length)
    throw new Error('EOF error');
  return this.row && this.row.get(name);
};

Rowset.prototype.set = function(name, value) {
  if (this.rowNum < 1)
    throw new Error('BOF error');
  if (this.rowNum > this.length)
    throw new Error('EOF error');
  this.row && this.row.set(name, value);
  return this;
};

/**
 * Returns the iterator
 *
 * @return {Object}
 */
Rowset.prototype.iterator = function() {
  const self = this;
  self.reset();
  return {
    next: function() {
      return {value: self.next(), done: self.isEof};
    }
  };
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

/**
 * Returns the iterator object contains rows
 *
 * @return {Object} - Returns the iterator object contains rows
 */
// eslint-disable-next-line no-undef
Rowset.prototype[Symbol.iterator] = Rowset.prototype.iterator;
