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
    this._connection = connection;
    connection.acquire();
    this._rownum = 0;
    this._fetchedRows = 0;
    this.cached = options && options.cached;
    this.bidirectional = this.cached || options && options.bidirectional;
    this.ignoreNulls = options && options.ignoreNulls;
    this.autoClose = options && options.autoClose;
    this._taskQueue = new TaskQueue({cancelOnError: true});
    if (options && options.onfetchrow && options.onfetchrow.length)
      options.onfetchrow.forEach((fn) => {
        this.on('fetchrow', fn);
      });
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

  get rowNum() {
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
   * @param {Function} [callback]
   * @return {Promise|undefined}
   */
  close(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.close(cb));

    const self = this;
    if (self.closed) {
      callback();
      return;
    }

    if (process.env.DEBUG)
      debug('Closing ResultSet');
    self._taskQueue.enqueue((nextTask) => {
      self._close((err) => {
        if (!err) {
          const con = this._connection;
          this._connection = undefined;
          con.close();
        }
        callback(err);
        nextTask();
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
    assert(this.bidirectional ||
        this.cached, 'Moving backward supported in bidirectional or cached mode only');
    if (!callback)
      return Promisify.fromCallback((cb) => this.first(cb));
    const self = this;
    self._taskQueue.enqueue((nextTask) => {
      self._first((...args) => {
        callback(...args);
        nextTask();
      });
    });
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
    self._taskQueue.enqueue((nextTask) => {
      self._fetchRows(rowStart, numRows, (...args) => {
        callback(...args);
        nextTask();
      });
    });
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

  _move(nRows, arrayResult, callback) {
    assert.ok(nRows, 'Insufficient arguments. nRows required');
    assert.ok(callback, 'Insufficient arguments. callback required');

    const self = this;

    function more() {
      self._taskQueue.enqueue((nextTask) => {
        if (self.closed || !nRows || (nRows > 0 && self.eof) ||
            (nRows < 0 && self.bof)) {
          callback();
          nextTask();
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
   * @param {Function} callback
   * @private
   */
  _fetchRows(rowStart, numRows, callback) {

    const self = this;
    if (rowStart < 1) {
      numRows = numRows + Math.min(rowStart, 0) - 1;
      rowStart = 1;
    }

    const out = [];
    if (numRows === 0) {
      callback(undefined, out);
      return;
    }

    self._initialize();
    //const lastRow = firstRow + Math.abs(steps);
    let skipRows = 0;

    const fetchDb = function(nrows) {
      if (self.closed || self.eof) {
        callback(undefined, []);
        return;
      }
      // Fetch records from database connection
      self._fetchDbRows(nrows, (err, rows) => {
        if (err)
          callback(err);
        else {
          if (process.env.DEBUG)
            debug('Fetched %d rows from database. Skipping %d rows', rows.length, skipRows);

          let k = self._fetchedRows;
          if (self.listenerCount('fetchrow') > 0) {
            for (const row of rows) {
              self.emit('fetchrow', row, k++, self.metaData);
            }
          }

          self._eof = rows.length < nrows;
          if (self.eof && self.autoClose)
            self.close();

          k = self._fetchedRows;
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
          callback(undefined, out);
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
          callback(undefined, out);

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
  _close(callback) {
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
    metaData.fields.forEach((field, idx) => {
      const v = row[idx];
      if (!(v === null && self.ignoreNulls))
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
