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
const debug = require('debug')('sqb:Cursor');
const EventEmitter = require('events').EventEmitter;
const ArgumentError = require('errorex').ArgumentError;
const TaskQueue = require('putil-taskqueue');
const promisify = require('putil-promisify');
const DoublyLinked = require('doublylinked');
const FieldCollection = require('./FieldCollection');
const CursorStream = require('./CursorStream');
const normalizeRows = require('../helper/normalizeRows');

const MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

/**
 *
 * @class
 */

class Cursor extends EventEmitter {
  /**
   *
   * @param {Array} connection
   * @param {Array} cursor
   * @param {Object} fields
   * @param {Object} options
   * @param {Object} [options.fetchRows]
   * @param {Object} [options.naming]
   * @constructor
   */
  constructor(connection, cursor, fields, options) {
    super();
    this._fields = new FieldCollection(fields, options);
    this._taskQueue = new TaskQueue();
    this._fetchCache = new DoublyLinked();
    this._prefetchRows = options.fetchRows;
    this._naming = options.naming;
    this._connection = connection;
    this._cursor = cursor;
    this._rowNum = 0;
    this._fetchedRows = 0;

    /* Cancel all awaiting tasks on error */
    this._taskQueue.on('error', () => this._taskQueue.clear());

    if (options.fetchEvents && options.fetchEvents.length)
      for (const fn of options.fetchEvents)
        this.on('fetch', fn);
    connection.acquire();
  }

  /**
   * Returns the Connection instance that connection owned by
   *
   * @return {Connection|*}
   */
  get connection() {
    return this._connection;
  }

  /**
   * Returns if cursor is before first record.
   *
   * @return {boolean}
   */
  get isBof() {
    return !this._rowNum;
  }

  /**
   * Returns if cursor is closed.
   *
   * @return {boolean}
   */
  get isClosed() {
    return !this._cursor;
  }

  /**
   * Returns if cursor is after last record.
   *
   * @return {boolean}
   */
  get isEof() {
    return this._fetchedAll && this.rowNum > this._fetchedRows;
  }

  /**
   * Returns number of fetched record count from database.
   *
   * @return {number|*}
   */
  get fetchedRows() {
    return this._fetchedRows;
  }

  /**
   * Returns FieldCollection instance which contains information about fields.
   *
   * @return {FieldCollection}
   */
  get fields() {
    return this._fields;
  }

  /**
   * Returns current record. If query executed with objectRows=true option,
   * this property returns object that contains field name/value pairs,
   * otherwise it returns array of values.
   *
   * @return {Object|Array|null}
   */
  get row() {
    return this._row;
  }

  /**
   * Returns current row number.
   *
   * @return {number}
   */
  get rowNum() {
    return this._rowNum;
  }

  /**
   * Enables cache
   *
   * @return {undefined}
   * @public
   */
  cached() {
    if (this.fetchedRows)
      throw new Error('Cache can be enabled before fetching rows');
    this._cache = new DoublyLinked();
  }

  /**
   * Decrease reference count and close cursor when reach to zero
   *
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   * @public
   */
  close(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.close(cb));

    if (this.isClosed)
      return callback();

    this._cursor.close((err) => {
      if (err)
        return callback(err);
      debug('close');
      this._connection.release();
      this._cursor = null;
      this._connection = null;
      this._emitSafe('close');
      callback();
    });
  }

  /**
   * If cache is enabled, this call fetches and keeps all records in the internal cache.
   * Otherwise it throws error. Once all all records fetched,
   * you can close Cursor safely and can continue to use it in memory.
   *
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  fetchAll(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.fetchAll(cb));

    if (!this._cache)
      return callback(new Error('fetchAll() method needs cache to be enabled'));
    this._seek(MAX_SAFE_INTEGER, (err) => {
      if (err)
        return callback(err);
      this._seek(-MAX_SAFE_INTEGER, (err) => {
        if (err)
          return callback(err);
        callback();
      });
    });
  }

  /**
   * Returns value of given field name of current record.
   *
   * @param {String} name
   * @return {Promise|Undefined}
   */
  get(name) {
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
  }

  /**
   * Moves cursor to given row number. If caching is enabled,
   * cursor can move both forward and backward. Otherwise it throws error.
   *
   * @param {Int} rowNum
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  moveTo(rowNum, callback) {
    return this.seek(rowNum - this.rowNum, callback);
  }

  /**
   * Moves cursor forward by one row and returns that row.
   * And also it allows iterating over rows easily.
   *
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  next(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.next(cb));

    const more = () => {
      this.seek(1, (err, row) => {
        if (err)
          return callback(err);
        if (row)
          callback(undefined, row, () => {
            setImmediate(more);
          });
        else callback();
      });
    };
    more();
  }

  /**
   *  Moves cursor back by one row and returns that row.
   *  And also it allows iterating over rows easily.
   *
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  prev(callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.prev(cb));

    const more = () => {
      this.seek(-1, (err, row) => {
        if (err)
          return callback(err);
        if (row)
          callback(undefined, row, () => {
            setImmediate(more);
          });
        else callback();
      });
    };
    more();
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Moves cursor before first row. (Required cache enabled)
   */
  reset() {
    if (!this._cache)
      throw new Error('reset() method needs cache to be enabled');
    this._cache.reset();
    this._rowNum = 0;
  }

  /**
   * Moves cursor by given step. If caching is enabled,
   * cursor can move both forward and backward. Otherwise it throws error.
   *
   * @param {Int} step
   * @param {Function} [callback]
   * @return {Promise|Undefined}
   */
  seek(step, callback) {
    if (!callback)
      return promisify.fromCallback((cb) => this.seek(step, cb));

    const curRowNum = this._rowNum;
    this._seek(step, (err, row, rowNum) => {
      if (err)
        return callback(err);
      if (rowNum !== curRowNum)
        this._emitSafe('move', row, rowNum);
      callback(undefined, row, rowNum);
    });
  }

  /**
   * Updates cached value of given field name of current record.
   *
   * @param {String} name
   * @param {*} value
   * @return {Cursor}
   */
  set(name, value) {
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
  }

  /**
   * Creates and returns a readable stream.
   *
   * @param {Object} [options]
   * @param {Boolean} [options.objectMode]
   * @param {Int} [options.outFormat]
   * @param {Int} [options.limit]
   * @param {Function} [options.stringify]
   * @return {CursorStream}
   */
  toStream(options) {
    return new CursorStream(this, options);
  }

  toString() {
    return '[object Cursor]';
  }

  inspect() {
    return this.toString();
  }

  /**
   *
   * @param {Function} callback
   * @return {*}
   * @private
   */
  _fetchRows(callback) {
    if (this.isClosed)
      return callback(new Error('Cursor closed'));
    this._cursor.fetch(this._prefetchRows, (err, rows) => {
      if (err)
        return callback(err);
      if (rows && rows.length) {
        debug('Fetched %d rows from database', rows.length);
        // Normalize rows
        normalizeRows(rows, {
          objectRows: this._objectRows,
          naming: this._naming,
          ignoreNulls: this._ignoreNulls
        });
        rows.forEach((row, idx) => {
          this._emitSafe('fetch', row, (this._rowNum + idx + 1));
        });
        /* Add rows to cache */
        if (this._cache)
          this._cache.push(...rows);
        else
          this._fetchCache.push(...rows);

        this._fetchedRows += rows.length;
        return callback();
      }
      this._fetchedAll = true;
      this._emitSafe('eof');
      this.close((err) => {
        if (err)
          return callback(err);
        callback();
      });
    });
  }

  /**
   *
   * @param {Int} step
   * @param {Function} callback
   * @return {*}
   * @private
   */
  _seek(step, callback) {
    step = parseInt(step, 10);
    if (!step)
      return callback(null, this._row, this._rowNum);

    if (step < 0 && !this._cache)
      callback(new Error('To move cursor back, it needs cache to be enabled'));

    this._taskQueue.push((done) => {

      const doCallback = (err) => {
        try {
          if (err)
            return callback(err);
          callback(null, this._row, this._rowNum);
        } finally {
          done();
        }
      };

      /* If moving backward */
      if (step < 0) {
        /* Seek cache */
        while (step < 0 && this._cache.cursor) {
          this._row = this._cache.prev();
          this._rowNum--;
          step++;
        }
        return doCallback();
      }

      /* If moving forward */

      const moveForward = () => {
        /* Seek cache */
        if (this._cache) {
          while (step > 0 && (this._row = this._cache.next())) {
            this._rowNum++;
            step--;
          }
        }
        /* Fetch from prefetch cache */
        while (step > 0 && (this._row = this._fetchCache.shift())) {
          this._rowNum++;
          step--;
        }
        if (!step || this._fetchedAll)
          return doCallback();
        /* Fetch records from db */
        this._fetchRows((err) => {
          if (err)
            return doCallback(err);
          if (this._fetchedAll) {
            this._row = null;
            this._rowNum++;
            if (this._cache)
              this._cache.next();
            return doCallback();
          }
          setImmediate(() => {
            moveForward();
          });
        });
      };

      moveForward();
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
 * Expose `Cursor`.
 */

module.exports = Cursor;

