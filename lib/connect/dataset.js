/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const DatasetMeta = require('./datasetmeta');
const {MemoryCache} = require('./datasetcache');
const DatasetStream = require('./datasetstream');
const {lowerCaseObjectKeys, upperCaseObjectKeys} = require('../helpers');
const defs = require('../defs');

/* External module dependencies. */
const assert = require('assert');
const debug = require('debug')('sqb:Dataset');
const {EventEmitter} = require('events');
const TaskQueue = require('putil-taskqueue');
const Promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');

/**
 * @class
 * @public
 */

class Dataset extends EventEmitter {

  constructor(cfg) {
    super();
    const self = this;
    const rows = !cfg.cursor ? cfg.rows : undefined;
    self._connection = cfg.cursor ? cfg.connection : undefined;
    if (self._connection)
      self._connection.acquire();
    self._cursor = cfg.cursor;
    self._refcount = cfg.connection ? 1 : 0;
    self._rownum = 0;
    self._fetchedRows = rows ? rows.length : 0;
    self._taskQueue = new TaskQueue({cancelOnError: true});
    self._caching = cfg.mode === defs.RESULT_CACHED_DATASET || rows;
    self._objectRows = cfg.objectRows ||
        (rows && rows.length &&
            typeof rows[0] === 'object' && !Array.isArray(rows[0]));
    self._ignoreNulls = cfg.ignoreNulls;
    self._naming = cfg.naming;
    self._metaData = cfg.metaData instanceof DatasetMeta ? cfg.metaData :
        new DatasetMeta(cfg.metaData, {naming: self._naming});

    self._values = new Proxy({}, {
      get: function(target, name) {
        const f = self._metaData.get(name);
        if (f) {
          const row = self.row;
          if (f.index >= self._metaData.length) return undefined;
          if (Array.isArray(row)) {
            return f.index < row.length ? row[f.index] : null;
          } else {
            return row[f.name];
          }
        }
      },
      set: function(obj, name, value) {
        const f = self._metaData.get(name);
        assert(f, 'Field not found (' + name + ')');
        const row = self.row;
        const rowNum = self.rowNum;
        if (f.index >= self._metaData.length) return undefined;
        if (Array.isArray(row)) {
          while (row.length < f.index + 1)
            row.push(null);
          row[f.index] = value;
        } else {
          row[f.name] = value;
        }
        if (self._cache && !rows)
          self._cache.set(rowNum, row);
        return true;
      }
    });

    if (cfg.onfetchrow && cfg.onfetchrow.length)
      cfg.onfetchrow.forEach((fn) => {
        self.on('fetchrow', fn);
      });

    if (rows) {
      self._normalizeObjectRows(rows);
      self._cache = new MemoryCache(rows);
      if (self.listenerCount('fetchrow') > 0) {
        let k = 0;
        for (const row of rows) {
          self._row = row;
          self.emit('fetchrow', self.values, ++k);
        }
      }
      self._row = undefined;
    }

  }

  /*
   * Properties
   */

  // noinspection JSUnusedGlobalSymbols
  set cache(value) {
    assert(!this.fetchedRows, 'Cache can be set before fetch operation');
    this._cache = value;
  }

  get connection() {
    return this._connection;
  }

  // noinspection JSUnusedGlobalSymbols
  get isBof() {
    return !this._rownum;
  }

  get isClosed() {
    return !(this._connection || this._cache);
  }

  // noinspection JSUnusedGlobalSymbols
  get isEof() {
    return this._rownum >= this._rows.length;
  }

  get fetchedRows() {
    return this._fetchedRows;
  }

  get metaData() {
    return this._metaData;
  }

  get mode() {
    return this._cursor ? 'cursor' : 'static';
  }

  get row() {
    return this._row;
  }

  get rowNum() {
    return this._rownum || 0;
  }

  get values() {
    return this._values;
  }

  /*
   * Functions
   */

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

    if (self.isClosed) {
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
      self._cache = undefined;
      if (!self._cursor)
        return callback();
      self._cursor.close((err) => {
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
              callback();
            }
            nextTask();
          });
        }
      });
    });

  }

  first(callback) {
    return this.seek(-this.rowNum, callback);
  }

  move(rowNum, callback) {
    return this.seek(rowNum - this.rowNum, callback);
  }

  next(step, callback) {
    if (typeof step === 'function') {
      callback = step;
      step = 1;
    } else
      step = parseInt(step) || 1;
    if (!callback)
      return Promisify.fromCallback((cb) => this.next(step, cb));

    if (!step)
      return callback();

    if (this.rowNum === 1 && step < 0) {
      this._rownum = 0;
      this._row = undefined;
      return callback();
    }

    assert(step > 0 || this._caching ||
        (this._cursor && this._cursor.bidirectional),
        'Caching or bidirectional cursor needed to move back');

    const self = this;
    const x = (step > 0 ? 1 : -1);

    function more() {
      const fromRow = self.rowNum + x;
      const toRow = fromRow + step - x;
      self._fetchRows(fromRow, toRow, (err, rows) => {
        if (rows) {
          self._rownum = fromRow + (rows.length * x) - x;
          self._row = rows[rows.length - 1];
          self.emit('move', self._rownum);
          callback(err, more, rows);
        } else callback(err);
      });
    }

    more();
  }

  prior(step, callback) {
    if (typeof step === 'function') {
      callback = step;
      step = 1;
    } else
      step = parseInt(step) || 1;
    return this.next(-step, callback);
  }

  seek(step, callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.seek(step, cb));

    const self = this;
    step = parseInt(step);
    if (step < 0)
      step = Math.max(step, -self.rowNum);
    if (step > 0 && !self._cursor)
      step = Math.min(step, self._fetchedRows - self._cursor);

    if (!step)
      return callback();

    assert(step > 0 || this._caching ||
        (this._cursor && this._cursor.bidirectional),
        'Caching or bidirectional cursor needed to move back');

    const x = (step > 0 ? 1 : -1);
    const seek = step - x;
    if (seek) {
      const doSeek = function(cb) {
        if (self._caching) {
          self._rownum = self._rownum + seek;
          cb();
        } else
          self._taskQueue.enqueue((nextTask) => {
            self._cursor.seek(seek, (err, v) => {
              try {
                if (!err)
                  self._rownum = self._rownum + v;
                cb(err, v);
              } finally {
                nextTask();
              }
            });
          });
      };

      doSeek((err) => {
        if (err)
          return callback(err);
        return self.next(x, callback);
      });
    } else
      return self.next(x, callback);

  }

  toStream(options) {
    return new DatasetStream(this, options);
  }

  toJSON() {
    return {
      metaData: this.metaData,
      rows: this.rows,
      numRows: this.rows.length,
      eof: true
    };
  }

  /*
   * Private Methods
   */

  _initialize() {
    if (this._initialized) return;
    this._initialized = true;
    if (this._caching && !this._cache)
      this._cache = new MemoryCache();
  }

  _fetchRows(fromRow, toRow, callback) {
    const self = this;
    self._initialize();

    self._taskQueue.enqueue((nextTask) => {
      let result;
      let rowsToFetch = Math.abs(fromRow - Math.max(toRow, 1)) + 1;

      waterfall([

            // Fetch rows from cache
            function(next) {
              if (!(rowsToFetch && self._cache))
                return next();

              self._cache.getRows(fromRow, toRow, (err, rows) => {
                if (err || !rows)
                  return next(err);
                if (process.env.DEBUG)
                  debug('Fetched %d rows from cache', rows.length);
                result = rows;
                rowsToFetch -= rows.length;
                next();
              });

            },

            // Fetch rows from from db
            function(next) {
              if (!(rowsToFetch && self._cursor && !self.isClosed))
                return next();
              if (toRow < fromRow && !self._cursor.bidirectional)
                return next(new Error('Bidirectional mode required to move cursor back'));

              self._cursor.fetch(fromRow, toRow, (err, rows) => {
                if (err)
                  return next(err);
                if (rows && rows.length) {
                  const oldFetchedRows = self._fetchedRows;
                  self._fetchedRows += rows.length;

                  if (process.env.DEBUG)
                    debug('Fetched %d rows from database', rows.length);

                  self._normalizeObjectRows(rows);

                  let k = oldFetchedRows;
                  for (const row of rows) {
                    self._row = row;
                    self._rownum = k++;
                    try {
                      self.emit('fetchrow', self.values, self._rownum);
                    } catch (e) {
                      // do nothing
                    }
                  }
                  // write rows to cache
                  if (self._caching && self._cache) {
                    let k = oldFetchedRows;
                    for (const row of rows)
                      self._cache.set(++k, row);
                  }
                  result = result ? Array.prototype.push.apply(result, rows) : rows;
                }
                if (!rows) {
                  self._fetchedAll = true;
                  next();
                  self._cursor.close(() => {});
                  self.emit('eof');
                } else next();
              });

            }
          ],

          // Final
          function(err) {
            try {
              if (err && err !== 'end')
                return callback(err);
              callback(undefined, result);
            } finally {
              nextTask();
            }
          });

    });

  }

  /**
   *
   * @param {Array} rows
   * @private
   */
  _normalizeObjectRows(rows) {
    const self = this;
    if (self._objectRows && rows && rows.length &&
        (self._naming || self._ignoreNulls)) {
      for (const row of rows) {
        // Apply naming rule to rows
        if (self._naming === 'lowercase')
          lowerCaseObjectKeys(row);
        else if (self._naming === 'uppercase')
          upperCaseObjectKeys(row);
        // Remove null properties of rows
        if (self._ignoreNulls)
          Object.getOwnPropertyNames(row).forEach(key => {
            if (row[key] === null)
              delete row[key];
          });
      }
    }
  }

}

module.exports = Dataset;
