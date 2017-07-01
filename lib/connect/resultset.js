/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const {SimpleResultCache} = require('./resultcache');
const RecordStream = require('./rowstream');

/* External module dependencies. */
const {EventEmitter} = require('events');
const assert = require('assert');
const Promisify = require('putil-promisify');
const debug = require('debug')('sqb:ResultSet');
const TaskQueue = require('putil-taskqueue');

/**
 * @class
 * @public
 */

class ResultSet extends EventEmitter {

  constructor(connection, options) {
    super();
    const self = this;
    self._refcount = 1;
    options = options && typeof options === 'object' ? options : {};
    self._connection = connection;
    self.ignoreNulls = options.ignoreNulls;
    self.objectRows = options.objectRows;
    self._rownum = 0;
    self._fetchedRows = 0;
    self._cached = options.cached;
    self._bidirectional = options.bidirectional;
    self._taskQueue = new TaskQueue({cancelOnError: true});
    self._prefetchRows = options.prefetchRows;
    if (options && options.onfetchrow && options.onfetchrow.length)
      options.onfetchrow.forEach((fn) => {
        this.on('fetchrow', fn);
      });
    connection.acquire();
  }

  get connection() {
    return this._connection;
  }

  get bof() {
    return !this._rownum;
  }

  get eof() {
    return this._fetchedAll && (this._rownum >= this._fetchedRows);
  }

  get rowNum() {
    return this._rownum || 0;
  }

  get fetchedRows() {
    return this._fetchedRows || 0;
  }

  set cache(value) {
    assert(!this.fetchedRows, 'Cache can not be changed after fetch');
    this._cache = value;
  }

  get closed() {
    return !this._connection;
  }

  acquire() {
    this._refcount++;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  close(callback) {
    const self = this;
    if (!callback)
      return Promisify.fromCallback((cb) => self.close(cb));

    if (self.closed) {
      callback();
      return;
    }

    self._taskQueue.enqueue((nextTask) => {
      const rc = --self._refcount;
      if (rc) {
        callback(undefined, rc);
        nextTask();
        return;
      }
      self._close((err) => {
        if (err) {
          callback(err);
          nextTask();
        } else {
          self._connection.close((err) => {
            if (err)
              callback(err);
            else {
              self._connection = undefined;
              self.emit('close');
            }
            nextTask();
          });
        }
      });
    });

  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {Function} callback
   * @return {Promise|undefined}
   * @public
   */
  first(callback) {
    assert(this._bidirectional ||
        this._cached, 'Moving backward supported in _bidirectional or _cached mode only');
    if (!callback)
      return Promisify.fromCallback((cb) => this.first(cb));
    const self = this;
    self._taskQueue.enqueue((nextTask) => {
      self._first((...args) => {
        self.emit('first');
        callback(...args);
        nextTask();
      });
    });
  }

  next(numRows, callback) {
    let options;
    if (typeof numRows === 'function') {
      callback = numRows;
      options = {};
    } else if (typeof numRows === 'object') {
      options = numRows;
    } else options = {numRows};
    if (!callback)
      return Promisify.fromCallback((cb) => this.next(options, cb));
    options.backward = false;
    this._move(options, callback);
  }

  prior(numRows, callback) {
    assert(this._bidirectional ||
        this._cached, 'Moving backward supported in _bidirectional or _cached mode only');
    let options;
    if (typeof numRows === 'function') {
      callback = numRows;
      options = {};
    } else if (typeof numRows === 'object') {
      options = numRows;
    } else options = {numRows};
    if (!callback)
      return Promisify.fromCallback((cb) => this.prior(options, cb));
    options.backward = true;
    this._move(options, callback);
  }

  getRows(rowStart, numRows, options, callback) {
    const self = this;
    assert(self._bidirectional ||
        self._cached, '"fetch" method supported in _bidirectional or _cached mode only');
    assert(rowStart && numRows, 'Invalid argument');
    if (arguments.length === 3) {
      if (typeof options === 'function') {
        callback = options;
        options = undefined;
      }
    }
    if (!callback)
      return Promisify.fromCallback((cb) => self.getRows(rowStart, numRows, options, cb));
    options = options || {};
    if (options.ignoreNulls === undefined)
      options.ignoreNulls = self.ignoreNulls;
    self._taskQueue.enqueue((nextTask) => {
      self._fetchRows(rowStart, numRows, options, (...args) => {
        callback(...args);
        nextTask();
      });
    });
  }

  toStream(options) {
    options = options || {};
    if (options.ignoreNulls === undefined)
      options.ignoreNulls = this.ignoreNulls;
    return new RecordStream(options, this);
  }

  /*
   * Private Methods
   */

  _initialize() {
    if (this._initialized) return;
    this._initialized = true;
    if (this._cached && !this._cache)
      this._cache = new SimpleResultCache();
  }

  _move(options, callback) {
    const self = this;
    const arrayResult = options.fetchCount;
    const nRows = options.fetchCount || 1;

    function more() {
      self._taskQueue.enqueue((nextTask) => {
        if (self.closed || !nRows || (nRows > 0 && self.eof) ||
            (nRows < 0 && self.bof)) {
          callback();
          nextTask();
          return;
        }
        const rowNum = self._rownum || 0;
        const rowStart = options.backward ? rowNum - nRows : rowNum + 1;
        if (options.ignoreNulls === undefined)
          options.ignoreNulls = self.ignoreNulls;
        self._fetchRows(rowStart, Math.abs(nRows), options, (err, rows) => {
          if (rows)
            self._rownum = options.backward ? rowNum + rows.length : rowStart +
                rows.length - 1;
          if (self._rownum === 1 && rowStart < 1)
            self._rownum = 0;
          self.emit('move', self._rownum);
          rows = arrayResult ? rows :
              (rows && rows.length ? rows[0] : undefined);
          callback(err, rows, more);
          nextTask();
        });
      });
    }

    more();
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {int} rowStart
   * @param {int} numRows
   * @param {Object} options
   * @param {boolean|undefined} [options.objectRows]
   * @param {Function} callback
   * @private
   */
  _fetchRows(rowStart, numRows, options, callback) {
    const self = this;
    if (rowStart < 1) {
      numRows = numRows + Math.min(rowStart, 0) - 1;
      rowStart = 1;
    }

    if (numRows === 0) {
      callback();
      return;
    }

    if (options.objectRows === undefined)
      options.objectRows = self.objectRows;
    self._initialize();
    //const lastRow = firstRow + Math.abs(steps);
    let skipRows = 0;
    const out = [];

    const fetchDb = function(nrows) {
      if (self.closed || self._fetchedAll) {
        callback();
        return;
      }
      // Fetch records from database connection
      self._fetchDbRows(nrows, (err, rows) => {
        if (err)
          callback(err);
        else {
          const needClose = !self._fetchedAll && (!rows || rows.length < nrows);

          if (rows && rows.length) {

            if (process.env.DEBUG)
              debug('Fetched %d rows from database. Skipping %d rows', rows.length, skipRows);

            let k = self._fetchedRows;
            if (self.listenerCount('fetchrow') > 0) {
              for (const row of rows)
                self.emit('fetchrow', row, k++, self.metaData);
            }

            k = self._fetchedRows;
            self._fetchedRows += rows.length;

            // write rows to cache
            if (self._cached && self._cache) {
              for (const row of rows)
                self._cache.set(++k, row);
            }

            // Push rows to result array
            for (const row of rows) {
              if (--skipRows < 0)
                out.push(options.objectRows ?
                    self._arrayRowToObj(row, options.ignoreNulls) :
                    row.slice());
            }
            if (!needClose)
              callback(undefined, out);
          }
          if (needClose) {
            self._fetchedAll = true;
            self.emit('eof');
            self._closeCursor(err => {
              if (err)
                callback(err);
              else
                callback(undefined, out.length ? out : undefined);
            });
          }
        }

      });
    };

    /*
     * Try to get rows from cache
     */
    const fetchedRows = self._fetchedRows;
    const rowsToReadCache = Math.min(numRows, fetchedRows - rowStart + 1);
    if (rowsToReadCache > 0 && self._cache) {
      self._fetchCachedRows(rowStart, rowsToReadCache, (err, rows) => {
        if (err) {
          callback(err);
          return;
        }
        if (process.env.DEBUG)
          debug('Fetched %d rows from cache', rows.length);

        if (rows.length !== rowsToReadCache) {
          callback(new Error('Cache read error'));
          return;
        }

        // Push rows to result array
        for (const row of rows)
          out.push(options.objectRows ?
              self._arrayRowToObj(row, options.ignoreNulls) :
              row.slice());

        // If there is more rows needed, we fetch them from database connection
        if (numRows - rows.length > 0)
          fetchDb(numRows - rows.length);
        else {
          if (out.length)
            callback(undefined, out);
          else callback();
        }

      });
    } else {
      skipRows = Math.max(rowStart - fetchedRows - 1, 0);
      fetchDb(numRows + skipRows);
    }

  }

  //noinspection JSMethodCanBeStatic
  /**
   * Closes ResultSet.
   * @param {Function} callback
   * @protected
   * @abstract
   */
  _close(callback) {
    if (process.env.DEBUG)
      debug('Closing ResultSet');
  }

  //noinspection JSMethodCanBeStatic
  /**
   * Closes Cursor
   * @param {Function} callback
   * @protected
   * @abstract
   */
  _closeCursor(callback) {
    if (process.env.DEBUG)
      debug('Closing Cursor');
  }

  /**
   *
   * @param {Function} callback
   * @protected
   */
  _first(callback) {
    this._rownum = 0;
    callback();
  }

  /**
   *
   * @param {int} rowNum
   * @param {int} numRows
   * @param {Function} callback
   * @private
   */
  _fetchCachedRows(rowNum, numRows, callback) {
    const self = this;
    const out = [];
    while (numRows > 0) {
      self._cache.get(rowNum++, (err, row) => {
        // If any error occurs we cancel whole operation
        if (err) {
          callback(err);
          return;
        }
        numRows--;
        out.push(row);
        if (!numRows) {
          callback(undefined, out);
        }
      });
    }
  }

  /**
   *
   * @param {Array} row
   * @param {boolean} ignoreNulls
   * @return {Object}
   * @private
   */
  _arrayRowToObj(row, ignoreNulls) {
    const out = {};
    const self = this;
    const metaData = self.metaData;
    metaData.fields.forEach((field, idx) => {
      const v = row[idx];
      if (!(v === null && ignoreNulls))
        out[field.name] = v;
    });
    return out;
  }

  /*
   * Abstract Protected Methods
   */

  //noinspection JSMethodCanBeStatic
  /**
   *
   * @param {int} numRows
   * @param {Function} callback
   * @protected
   * @abstract
   */
  _fetchDbRows(numRows, callback) {
    throw new Error('Abstract error');
  }

}

module.exports = ResultSet;
