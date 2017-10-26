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
const debug = require('debug')('sqb:Dataset');
const EventEmitter = require('events').EventEmitter;
const ArgumentError = require('errorex').ArgumentError;
const TaskQueue = require('putil-taskqueue');
const promisify = require('putil-promisify');
const waterfall = require('putil-waterfall');
const DatasetMeta = require('./datasetmeta');
const MemoryCache = require('./datasetcache').MemoryCache;
const DatasetStream = require('./datasetstream');
const normalizeRows = require('../normalizeRows');
const types = require('../types');

const DatasetMode = types.DatasetMode;

/**
 * Expose `Dataset`.
 */

module.exports = Dataset;

/**
 *
 * @param {Connection} connection
 * @param {Object} response
 * @param {Object} options
 * @constructor
 */
function Dataset(connection, response, options) {
  EventEmitter.call(this);
  const self = this;
  const rows = !response.cursor ? response.rows : undefined;

  self._connection = response.cursor ? connection : undefined;
  if (self._connection)
    self._connection.acquire();
  self._cursor = response.cursor;
  self._refcount = self._connection ? 1 : 0;
  self._rownum = 0;
  self._fetchedRows = (rows && rows.length) || 0;
  self._taskQueue = new TaskQueue({cancelOnError: true});
  self._caching = options.datasetMode === DatasetMode.CACHED || rows;
  self._objectRows = options.objectRows ||
      (rows && rows.length && typeof rows[0] === 'object' &&
          !Array.isArray(rows[0]));
  self._ignoreNulls = options.ignoreNulls;
  self._naming = options.naming;
  self._metaData = new DatasetMeta(response.metaData, options);

  if (options.onfetchrow && options.onfetchrow.length)
    options.onfetchrow.forEach(function(fn) {
      self.on('fetchrow', fn);
    });

  if (rows) {
    self._cache = new MemoryCache(rows);
    if (self.listenerCount('fetchrow') > 0) {
      rows.forEach(function(row, k) {
        self._row = row;
        self.emit('fetchrow', self.values, k + 1);
      });
    }
    self._row = undefined;
  }

}

const proto = Dataset.prototype = {

  set cache(value) {
    if (this.fetchedRows)
      throw new Error('Cache can be set before fetch operation');
    this._cache = value;
  },

  get connection() {
    return this._connection;
  },

  // noinspection JSUnusedGlobalSymbols
  get isBof() {
    return !this._rownum;
  },

  get isClosed() {
    return !(this._connection || this._cache);
  },

  // noinspection JSUnusedGlobalSymbols
  get isEof() {
    return this._eof;
  },

  get fetchedRows() {
    return this._fetchedRows;
  },

  get metaData() {
    return this._metaData;
  },

  get mode() {
    return this._cursor ? 'cursor' : 'static';
  },

  get row() {
    return this._row;
  },

  get rowNum() {
    return this._rownum || 0;
  }
};
Object.setPrototypeOf(proto, EventEmitter.prototype);
proto.constructor = Dataset;

/**
 *
 */
proto.acquire = function() {
  this._refcount++;
};

/**
 * @param {Function} [callback]
 * @return {Promise|undefined}
 */
proto.close = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.close(cb);
    });

  if (self.isClosed) {
    callback();
    return;
  }
  self._taskQueue.enqueue(function(nextTask) {
    const rc = --self._refcount;
    if (rc) {
      callback(undefined, rc);
      nextTask();
      return;
    }
    self._cache = undefined;
    if (!self._cursor)
      return callback();
    self._cursor.close(function(err) {
      if (err) {
        callback(err);
        nextTask();
      } else {
        self._connection.close(function(err) {
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
};

proto.getValue = function(name) {
  const f = this._metaData.get(name);
  if (!f)
    throw new ArgumentError('Field `%s` not found', name);
  const row = this.row;
  if (!row)
    return null;
  if (Array.isArray(row)) {
    return f.index <= row.length ? row[f.index] : null;
  } else
    return row[f.name] || null;
};

proto.setValue = function(name, value) {
  const f = this._metaData.get(name);
  if (!f || f.index >= this._metaData.length)
    throw new ArgumentError('Field `%s` not found', name);
  const row = this.row;
  if (!row) return;
  const rowNum = this.rowNum;
  if (Array.isArray(row)) {
    while (row.length < f.index + 1)
      row.push(null);
    row[f.index] = value;
  } else {
    row[f.name] = value;
  }
  if (this._cache)
    this._cache.set(rowNum, row);
  return true;
};

proto.first = function(callback) {
  return this.seek(-this.rowNum, callback);
};

proto.move = function(rowNum, callback) {
  return this.seek(rowNum - this.rowNum, callback);
};

proto.next = function(step, callback) {
  if (typeof step === 'function') {
    callback = step;
    step = 1;
  } else
    step = parseInt(step) || 1;
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.next(step, cb);
    });

  if (!step)
    return callback();

  if (this.rowNum === 1 && step < 0) {
    this._rownum = 0;
    this._row = undefined;
    return callback();
  }

  if (!(step > 0 || this._caching ||
          (this._cursor && this._cursor.bidirectional)))
    throw new Error('Caching or bidirectional cursor needed to move back');

  const x = (step > 0 ? 1 : -1);

  function more() {
    const fromRow = self.rowNum + x;
    const toRow = fromRow + step - x;
    self._fetchRows(fromRow, toRow, function(err, rows) {
      if (rows) {
        self._rownum = fromRow + (rows.length * x) - x;
        self._row = rows[rows.length - 1];
        self.emit('move', self._rownum);
        callback(err, more, rows);
      } else callback(err);
    });
  }

  more();
};

proto.prior = function(step, callback) {
  if (typeof step === 'function') {
    callback = step;
    step = 1;
  } else
    step = parseInt(step) || 1;
  return this.next(-step, callback);
};

proto.seek = function(step, callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.seek(step, cb);
    });

  step = parseInt(step);
  if (step < 0)
    step = Math.max(step, -self.rowNum);
  if (step > 0 && !self._cursor)
    step = Math.min(step, self._fetchedRows - self._cursor);

  if (!step)
    return callback();

  if (!(step > 0 || this._caching ||
          (this._cursor && this._cursor.bidirectional)))
    throw new Error('Caching or bidirectional cursor needed to move back');

  const x = (step > 0 ? 1 : -1);
  const seek = step - x;
  if (seek) {
    const doSeek = function(cb) {
      if (self._caching) {
        self._rownum = self._rownum + seek;
        cb();
      } else
        self._taskQueue.enqueue(function(nextTask) {
          self._cursor.seek(seek, function(err, v) {
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

    doSeek(function(err) {
      if (err)
        return callback(err);
      return self.next(x, callback);
    });
  } else
    return self.next(x, callback);
};

proto.toStream = function(options) {
  return new DatasetStream(this, options);
};

proto.toJSON = function() {
  return {
    metaData: this.metaData,
    rows: this.rows,
    numRows: this.rows.length,
    eof: true
  };
};

/*
 * Private Methods
 */

proto._initialize = function() {
  if (this._initialized) return;
  this._initialized = true;
  if (this._caching && !this._cache)
    this._cache = new MemoryCache();
};

proto._fetchRows = function(fromRow, toRow, callback) {
  const self = this;
  self._initialize();

  self._taskQueue.enqueue(function(nextTask) {
    var result;
    var rowsToFetch = Math.abs(fromRow - Math.max(toRow, 1)) + 1;

    waterfall([

          // Fetch rows from cache
          function(next) {
            if (!(rowsToFetch && self._cache))
              return next();

            self._cache.getRows(fromRow, toRow, function(err, rows) {
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
            if (!rowsToFetch)
              return next();
            if (!(self._cursor && !self.isClosed)) {
              self._eof = true;
              self.emit('eof');
              return next();
            }
            if (toRow < fromRow && !self._cursor.bidirectional)
              return next(new Error('Bidirectional mode required to move cursor back'));

            self._cursor.fetch(fromRow, toRow, function(err, rows) {
              if (err)
                return next(err);
              if (rows && rows.length) {
                const oldFetchedRows = self._fetchedRows;
                self._fetchedRows += rows.length;

                if (process.env.DEBUG)
                  debug('Fetched %d rows from database', rows.length);

                normalizeRows(rows, {
                  objectRows: self._objectRows,
                  naming: self._naming,
                  ignoreNulls: self._ignoreNulls
                });

                var k = oldFetchedRows;
                rows.forEach(function(row) {
                  self._row = row;
                  self._rownum = k++;
                  try {
                    self.emit('fetchrow', self.values, self._rownum);
                  } catch (e) {
                    // do nothing
                  }
                });
                // write rows to cache
                if (self._caching && self._cache) {
                  k = oldFetchedRows;
                  rows.forEach(function(row) {
                    self._cache.set(++k, row);
                  });
                }
                result = result ? Array.prototype.push.apply(result, rows) : rows;
              }
              if (!rows) {
                self._eof = true;
                next();
                self._cursor.close(function() {});
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

};

