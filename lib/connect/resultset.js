/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const {SimpleResultCache} = require('./resultcache');

/* External module dependencies. */
const assert = require('assert');
const Promisify = require('putil-promisify');
const debug = require('debug')('sqb:ResultSet');

/**
 * @class
 * @public
 */

class ResultSet {

  constructor(connection, options) {
    this._connection = connection;
    connection.acquire();
    this._rownum = 0;
    this._fetchedRows = 0;
    this.cached = options && options.cached;
    this.bidirectional = this.cached || options && options.bidirectional;
    this.ignoreNulls = options && options.ignoreNulls;
    this.autoClose = options && options.autoClose;
    this.onfetchrow = options && options.onfetchrow;
    this._taskQueue = [];
  }

  get connection() {
    return this._connection;
  }

  get bof() {
    return !this._rownum;
  }

  get eof() {
    return !!this._eof;
  }

  get row() {
    return this._rownum || 0;
  }

  get fetchedRows() {
    return this._fetchedRows || 0;
  }

  set cache(value) {
    this._cache = value;
  }

  get closed() {
    return !this._connection;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  close(callback) {
    if (this._connection) {
      if (process.env.DEBUG)
        debug('Closing ResultSet');
      const con = this._connection;
      this._connection = undefined;
      this._taskQueue = [];
      this._taskRunning = false;
      return con.close(callback);
    } else callback();
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {Function} callback
   * @return {Promise|undefined}
   * @public
   */
  first(callback) {
    assert(this.bidirectional ||
        this.cached, 'Moving backward supported in bidirectional or cached mode only');
    if (!callback)
      return Promisify.fromCallback((cb) => this.first(cb));
    const self = this;
    self._addTask(() => {
      self._first((...args) => {
        self._taskRunning = false;
        callback(...args);
        self._nextTask();
      });
    });
    self._nextTask();
  }

  next(nRows, callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.next(nRows, cb));
    if (typeof nRows === 'function') {
      callback = nRows;
      nRows = undefined;
    }
    this._move(nRows || 1, !!nRows, callback);
  }

  prior(nRows, callback) {
    assert(this.bidirectional ||
        this.cached, 'Moving backward supported in bidirectional or cached mode only');
    if (!callback)
      return Promisify.fromCallback((cb) => this.prior(nRows, cb));
    if (typeof nRows === 'function') {
      callback = nRows;
      nRows = undefined;
    }
    this._move(-(nRows || 1), !!nRows, callback);
  }

  fetch(rowStart, numRows, callback) {
    assert(this.bidirectional ||
        this.cached, '"fetch" method supported in bidirectional or cached mode only');
    assert(rowStart && numRows, 'Invalid argument');
    if (!callback)
      return Promisify.fromCallback((cb) => this.fetch(rowStart, numRows, cb));
    const self = this;
    self._addTask(() => {
      self._fetchRows(rowStart, numRows, (...args) => {
        self._taskRunning = false;
        callback(...args);
        self._nextTask();
      });
    });
    self._nextTask();
  }

  /*
   * Private Methods
   */

  _initialize() {
    if (this._initialized) return;
    this._initialized = true;
    if (this.cached && !this._cache)
      this._cache = new SimpleResultCache();
  }

  _addTask(fn) {
    this._taskQueue.push(fn);
    this._nextTask();
  }

  _nextTask() {
    const self = this;
    if (self._taskRunning) return;
    if (self.closed) {
      self._taskQueue = [];
      return;
    }
    if (self._taskQueue.length > 0) {
      const fn = self._taskQueue[0];
      self._taskQueue.splice(0, 1);
      self._taskRunning = true;
      setImmediate(fn);
    }
  }

  _move(nRows, arrayResult, callback) {
    assert.ok(nRows, 'Insufficient arguments. nRows required');
    assert.ok(callback, 'Insufficient arguments. callback required');

    const self = this;

    function more() {
      self._addTask(() => {
        if (self.closed || !nRows || (nRows > 0 && self.eof) ||
            (nRows < 0 && self.bof)) {
          callback();
          return;
        }
        const rowNum = self._rownum || 0;
        const rowStart = nRows > 0 ? rowNum + 1 : rowNum + nRows;

        self._fetchRows(rowStart, Math.abs(nRows), (err, rows) => {
          if (rows) {
            self._rownum = nRows > 0 ? (rowStart + rows.length - 1) :
                (rowNum - rows.length);
          }
          if (self._rownum === 1 && rowStart < 1)
            self._rownum = 0;
          callback(err,
              arrayResult ? rows : (rows ? rows[0] : undefined),
              () => setImmediate(() => more()));
        });
      });
      self._nextTask();
    }

    more();
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {int} rowStart
   * @param {int} numRows
   * @param {Function} callback
   * @private
   */
  _fetchRows(rowStart, numRows, callback) {
    const self = this;
    if (rowStart < 1) {
      numRows = numRows + Math.min(rowStart, 0) - 1;
      rowStart = 1;
    }

    const doCallback = function(err, result) {
      self._taskRunning = false;
      callback(err, result);
      self._nextTask();
    };

    const out = [];
    if (numRows === 0) {
      doCallback(undefined, out);
      return;
    }

    self._initialize();
    //const lastRow = firstRow + Math.abs(steps);
    let skipRows = 0;

    const fetchDb = function(nrows) {
      if (self.closed || self.eof) {
        doCallback(undefined, []);
        return;
      }
      // Fetch records from database connection
      self._fetchDbRows(nrows, (err, rows) => {
        if (err)
          doCallback(err);
        else {
          if (process.env.DEBUG)
            debug('Fetched %d rows from database. Skipping %d rows', rows.length, skipRows);

          self._eof = rows.length < nrows;
          if (self.eof && self.autoClose)
            self.close();

          let k = self._fetchedRows;
          self._fetchedRows += rows.length;
          // write rows to cache
          if (self.cached && self._cache) {
            for (const row of rows) {
              self._cache.set(++k, row);
            }
          }

          // Push rows to result array
          for (const row of rows) {
            if (--skipRows < 0)
              out.push(self._arrayRowToObj(row));
          }
          doCallback(undefined, out);
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
          out.push(self._arrayRowToObj(row));

        // If there is more rows needed, we fetch them from database connection
        if (numRows - rows.length > 0)
          fetchDb(numRows - rows.length);
        else
          doCallback(undefined, out);

      });
    } else {
      skipRows = Math.max(rowStart - fetchedRows - 1, 0);
      fetchDb(numRows + skipRows);
    }

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
   * @return {Object}
   * @private
   */
  _arrayRowToObj(row) {
    const out = {};
    const self = this;
    const metaData = self.metaData;
    Object.getOwnPropertyNames(metaData).forEach(key => {
      const v = row[metaData[key].index];
      if (!(v === null && self.ignoreNulls))
        out[key] = row[metaData[key].index];
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
