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
const promisify = require('putil-promisify');
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
   * @param {Function} [callback]
   * @return {Promise|undefined}
   * @public
   */
  close(callback) {
    this.pause();
    this.unpipe();

    if (!callback)
      return promisify.fromCallback((cb) => this.close(cb));

    this._cursor.close((err) => {
      callback(err);
      if (err && this.listenerCount('error') > 0)
        this._emitSafe('error', err);
    });
  }

  toString() {
    return '[object CursorStream]';
  }

  inspect() {
    return this.toString();
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * @private
   * @override
   */
  _read() {
    const cursor = this._cursor;
    if (this._rowNum < 0) {
      this._rowNum = 0;
      const fields = cursor.fields.toObject();
      this._emitSafe('fields', fields);
      if (!this._objectMode) {
        this.push(!this._outFormat ? '[' :
            '{"fields":' + this.stringify(fields) + ', "rows":[');
      }
    }
    cursor.next((err, row) => {
      if (err) {
        /* istanbul ignore next */
        if (typeof this.destroy == 'function')
          this.destroy(err);
        else
          this.close(() => this._emitSafe('error', err));
        return;
      }
      if (!row) {
        if (!this._objectMode) {
          this.push(!this._outFormat ? ']' :
              '], "numRows":' + (this._rowNum) + ', "eof": true}');

        }
      }
      this._rowNum++;
      this.push(!row || this._objectMode ? row || null :
          (this._rowNum > 1 ? ', ' : '') + this.stringify(row));
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
