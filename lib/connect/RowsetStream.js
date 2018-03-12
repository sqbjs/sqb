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
const extensions = require('../extensions');

/**
 * @class
 */
class RowsetStream extends Readable {
  /**
   *
   * @param {Rowset} rowset
   * @param {Object} options
   * @constructor
   */
  constructor(rowset, options) {
    super(options);
    options = options || {};
    this._rowset = rowset;
    this._objectMode = options.objectMode;
    this._outFormat = options.outFormat || 0;
    this._rowNum = -1;
    this._fetchedRows = 0;
    this.stringify = options.stringify || extensions.stringify ||
        /* istanbul ignore next */
        JSON.stringify;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * @private
   * @override
   */
  _read() {
    const rowset = this._rowset;
    if (this._rowNum < 0) {
      this._rowNum = 0;
      const fields = rowset.fields.toObject();
      this._emitSafe('fields', fields);
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
  }

  /**
   *
   * @private
   */
  _emitSafe(...args) {
    try {
      this.emit(...args);
    } catch (ignored) {
      //
    }
  }

}

/**
 * Expose `RowsetStream`.
 */
module.exports = RowsetStream;
