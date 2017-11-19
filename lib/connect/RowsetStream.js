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
const Readable = require('stream').Readable;
const plugins = require('../plugins');

/**
 * Expose `RowsetStream`.
 */

module.exports = RowsetStream;

/**
 *
 * @param {Rowset} rowset
 * @param {Object} options
 * @constructor
 */
function RowsetStream(rowset, options) {
  Readable.call(this, options);
  options = options || {};
  this._rowset = rowset;
  this._objectMode = options.objectMode;
  this._outFormat = options.outFormat || 0;
  this.stringify = options.stringify || plugins.stringify || JSON.stringify;
  this._rowNum = -1;
}

Object.setPrototypeOf(RowsetStream.prototype, Readable.prototype);
RowsetStream.prototype.constructor = RowsetStream;

/**
 * @private
 * @override
 */
RowsetStream.prototype._read = function() {
  const rowset = this._rowset;
  if (this._rowNum < 0) {
    this._rowNum = 0;
    const fields = rowset.fields.toObject();
    this.emit('fields', fields);
    if (!this._objectMode) {
      this.push(!this._outFormat ? '[' :
          '{"fields":' + this.stringify(fields) + ', "rows":[');
    }
  }
  const row = rowset.next();
  if (!row) {
    if (!this._objectMode) {
      this.push(!this._outFormat ? ']' :
          '], "numRows":' + (this._rowNum) + ', "eof": true}');

    }
  }
  this._rowNum++;
  this.push(!row || this._objectMode ? row || null :
      (this._rowNum > 1 ? ', ' : '') + this.stringify(row));
};
