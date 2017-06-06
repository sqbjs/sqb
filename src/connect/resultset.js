/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Promisify = require('../helpers/promisify');
const {SimpleResultCache} = require('./resultcache');

/* External module dependencies. */
const assert = require('assert');
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
    assert(this.bidirectional, 'Moving cursor backward supported in bidirectional mode only');
    const self = this;

    function doFirst(cb) {
      self._rownum = 0;
      cb();
    }

    if (callback)
      doFirst(callback);
    else return Promisify.fromCallback(doFirst);
  }

  next(nRows, callback) {

    if (typeof nRows === 'function') {
      callback = nRows;
      nRows = undefined;
    }
    nRows = nRows === undefined ? 1 : nRows;
    return this.fetch(this._rownum + nRows, undefined, callback);
  }

  prior(nRows, callback) {

    if (typeof nRows === 'function') {
      callback = nRows;
      nRows = undefined;
    }
    nRows = nRows === undefined ? 1 : nRows;
    return this.fetch(this._rownum - nRows, undefined, callback);
  }

  fetch(numStart, numRows, callback) {
    assert(numStart > 0, 'Invalid argument');

    if (typeof numRows === 'function') {
      callback = numRows;
      numRows = numStart;
      numStart = 1;
    }
    const self = this;
    const arrayResult = numRows !== undefined;
    numRows = numRows || 1;

    function doFetch(cb) {
      self._fetchRows(numStart, numRows, (err, rows) => {
        if (err)
          cb(err);
        else {
          if (arrayResult) {
            cb(undefined, rows);
            self._rownum =
                Math.min(self._fetchedRows, numStart - 1) + rows.length;
          } else {
            rows = (rows.length ? rows[0] : undefined);
            self._rownum =
                Math.min(self._fetchedRows, numStart - 1) + (rows ? 1 : 0);
            cb(undefined, rows);
          }
        }
      });
    }

    if (callback)
      doFetch(callback);
    else return Promisify.fromCallback(doFetch);
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

  //noinspection JSUnusedGlobalSymbols
  /**
   * @param {int} rowStart
   * @param {int} numRows
   * @param {Function} callback
   * @private
   */
  _fetchRows(rowStart, numRows, callback) {
    const self = this;
    self._initialize();

    if (numRows <= 0) {
      callback(undefined, []);
      return;
    }

    const out = [];
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
