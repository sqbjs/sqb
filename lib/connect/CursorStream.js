/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const Readable = require('stream').Readable;
const extensions = require('../extensions');

/**
 *
 * @class
 */
class CursorStream extends Readable {
  /**
   *
   * @param {Cursor} cursor
   * @param {Object} options
   * @constructor
   */
  constructor(cursor, options) {
    super(options);
    options = options || {};

    this._cursor = cursor;
    this._objectMode = options.objectMode;
    this._outFormat = options.outFormat || 0;
    this._limit = options.limit;
    this._rowNum = -1;
    this._fetchedRows = 0;
    this.stringify = options.stringify || extensions.stringify ||
        /* istanbul ignore next */
        JSON.stringify;

    this.on('end', () => this.close());

    cursor.once('close', () => this._emitSafe('close'));
    cursor.on('error', (err) => this._emitSafe('error', err));
  }

  /**
   * Returns if stream is closed.
   *
   * @return {boolean}
   */
  get isClosed() {
    return this._cursor.isClosed;
  }

  /**
   * Closes stream and releases the cursor
   *
   * @return {Promise}
   * @public
   */
  close() {
    this.pause();
    this.unpipe();
    return this._cursor.close();
  }

  toString() {
    return '[object ' + Object.getPrototypeOf(this).constructor.name + ']';
  }

  inspect() {
    return this.toString();
  }

  /**
   * @private
   * @override
   */
  _read() {
    if (this._rowNum >= this._limit) {
      this.pause();
      this.unpipe();
      return;
    }
    this._cursor.next().then(row => {
      if (this._eof)
        return this.push(null);
      let buf = '';
      if (this._rowNum < 0) {
        this._rowNum = 0;
        if (!this._objectMode) {
          if (this._outFormat === 1)
            buf += '{"rows": [';
          else
            buf += '[';
        }
      }
      if (!row) {
        this._eof = true;
        if (!this._objectMode) {
          buf += ']';
          if (this._outFormat === 1)
            buf += ', "numRows":' + (this._rowNum) + ', "eof": true}';
          this.push(buf);
        } else this.push(null);
        return;
      }
      this._rowNum++;
      if (this._objectMode)
        this.push(row);
      else {
        if (this._rowNum > 1)
          buf += ',';
        this.push(buf + this.stringify(row));
      }
    }).catch(err => {
      /* istanbul ignore next */
      if (typeof this.destroy == 'function')
        this.destroy(err);
      else
        this._emitSafe('error', err);
      this.close().catch(() => 0);
    });
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
 * Expose `CursorStream`.
 */

module.exports = CursorStream;
