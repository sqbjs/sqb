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
const debug = require('debug')('sqb:Cursor');
const EventEmitter = require('events').EventEmitter;
const ArgumentError = require('errorex').ArgumentError;
const TaskQueue = require('putil-taskqueue');
const promisify = require('putil-promisify');
const defineConst = require('putil-defineconst');
const DoublyLinked = require('doublylinked');
const FieldCollection = require('./FieldCollection');
const CursorStream = require('./CursorStream');
const normalizeRows = require('../helper/normalizeRows');

const MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

/**
 * Expose `Cursor`.
 */

module.exports = Cursor;

/**
 *
 * @param {Array} connection
 * @param {Array} cursor
 * @param {Object} fields
 * @param {Object} options
 * @constructor
 */
function Cursor(connection, cursor, fields, options) {
  EventEmitter.call(this);
  const self = this;
  defineConst(this, {
    _fields: new FieldCollection(fields, options),
    _taskQueue: new TaskQueue(),
    _fetchCache: new DoublyLinked(),
    _prefetchRows: options.fetchRows,
    _naming: options.naming
  }, false);
  defineConst(this, {
    _connection: connection,
    _cursor: cursor,
    _rowNum: 0,
    _fetchedRows: 0
  }, {
    writable: true,
    enumerable: false
  });
  /* Cancel all awaiting tasks on error */
  self._taskQueue.on('error', function() {
    self._taskQueue.clear();
  });

  if (options.fetchEvents && options.fetchEvents.length)
    options.fetchEvents.forEach(function(fn) {
      self.on('fetch', fn);
    });
  connection.acquire();
}

Cursor.prototype = {

  get connection() {
    return this._connection;
  },

  get isBof() {
    return !this._rowNum;
  },

  get isClosed() {
    return !this._cursor;
  },

  get isEof() {
    return this._fetchedAll && this.rowNum > this._fetchedRows;
  },

  get fetchedRows() {
    return this._fetchedRows;
  },

  get fields() {
    return this._fields;
  },

  get row() {
    return this._row;
  },

  get rowNum() {
    return this._rowNum;
  }
};
Object.setPrototypeOf(Cursor.prototype, EventEmitter.prototype);
Cursor.prototype.constructor = Cursor;

/**
 * Enables caching records
 * @return {undefined}
 * @public
 */
Cursor.prototype.cached = function() {
  if (this.fetchedRows)
    throw new Error('Cache can be enabled before fetching rows');
  this._cache = new DoublyLinked();
};

/**
 * Decrease reference count and close cursor when reach to zero
 * @param {Function} callback
 * @return {undefined}
 * @public
 */
Cursor.prototype.close = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.close(cb);
    });

  if (self.isClosed)
    return callback();

  this._cursor.close(function(err) {
    if (err)
      return callback(err);
    debug('close');
    self._connection.release();
    self._cursor = null;
    self._connection = null;
    self.emit('close');
    callback();
  });
};

Cursor.prototype.fetchAll = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.fetchAll(cb);
    });
  if (!this._cache)
    return callback(new Error('fetchAll() method needs cache to be enabled'));
  self._seek(MAX_SAFE_INTEGER, function(err) {
    if (err)
      return callback(err);
    self._seek(-MAX_SAFE_INTEGER, function(err) {
      if (err)
        return callback(err);
      callback();
    });
  });
};

Cursor.prototype.get = function(name) {
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
};

Cursor.prototype.moveTo = function(rowNum, callback) {
  return this.seek(rowNum - this.rowNum, callback);
};

Cursor.prototype.next = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.next(cb);
    });

  const more = function() {
    self.seek(1, function(err, row) {
      if (err)
        return callback(err);
      if (row)
        callback(undefined, row, function() {
          setImmediate(more);
        });
      else callback();
    });
  };
  more();
};

Cursor.prototype.prev = function(callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.prev(cb);
    });

  const more = function() {
    self.seek(-1, function(err, row) {
      if (err)
        return callback(err);
      if (row)
        callback(undefined, row, function() {
          setImmediate(more);
        });
      else callback();
    });
  };
  more();
};

Cursor.prototype.reset = function() {
  if (!this._cache)
    throw new Error('reset() method needs cache to be enabled');
  this._cache.reset();
  this._rowNum = 0;
};

Cursor.prototype.seek = function(step, callback) {
  const self = this;
  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.seek(step, cb);
    });
  const curRowNum = self._rowNum;
  self._seek(step, function(err, row, rowNum) {
    if (err)
      return callback(err);
    if (rowNum !== curRowNum)
      self._emitSafe('move', row, rowNum);
    callback(undefined, row, rowNum);
  });
};

Cursor.prototype.set = function(name, value) {
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
};

Cursor.prototype.toStream = function(options) {
  return new CursorStream(this, options);
};

/*
 * Private Methods
 */

Cursor.prototype._emitSafe = function() {
  try {
    this.emit.apply(this, arguments);
  } catch (e) {
    //
  }
};

Cursor.prototype._fetchRows = function(callback) {
  const self = this;
  if (self.isClosed)
    return callback(new Error('Cursor closed'));
  self._cursor.fetch(self._prefetchRows, function(err, rows) {
    if (err)
      return callback(err);
    if (rows && rows.length) {
      debug('Fetched %d rows from database', rows.length);
      // Normalize rows
      normalizeRows(rows, {
        objectRows: self._objectRows,
        naming: self._naming,
        ignoreNulls: self._ignoreNulls
      });
      rows.forEach(function(row, idx) {
        self._emitSafe('fetch', row, (self._rowNum + idx + 1));
      });
      /* Add rows to cache */
      if (self._cache)
        self._cache.push.apply(self._cache, rows);
      else
        self._fetchCache.push.apply(self._fetchCache, rows);

      self._fetchedRows += rows.length;
      return callback();
    }
    self._fetchedAll = true;
    self._emitSafe('eof');
    self.close(function(err) {
      if (err)
        return callback(err);
      callback();
    });
  });
};

Cursor.prototype._seek = function(step, callback) {

  const self = this;
  step = parseInt(step, 10);
  if (!step)
    return callback(undefined, self._row, self._rowNum);

  if (step < 0 && !self._cache)
    callback(new Error('To move cursor back, it needs cache to be enabled'));

  self._taskQueue.push(function(done) {

    const doCallback = function(err) {
      try {
        if (err)
          return callback(err);
        callback(undefined, self._row, self._rowNum);
      } finally {
        done();
      }
    };

    /* If moving backward */
    if (step < 0) {
      /* Seek cache */
      while (step < 0 && self._cache.cursor) {
        self._row = self._cache.prev();
        self._rowNum--;
        step++;
      }
      return doCallback();
    }

    /* If moving forward */

    const moveForward = function() {
      /* Seek cache */
      if (self._cache) {
        while (step > 0 && (self._row = self._cache.next())) {
          self._rowNum++;
          step--;
        }
      }
      /* Fetch from prefetch cache */
      while (step > 0 && (self._row = self._fetchCache.shift())) {
        self._rowNum++;
        step--;
      }
      if (!step || self._fetchedAll)
        return doCallback();
      /* Fetch records from db */
      self._fetchRows(function(err) {
        if (err)
          return doCallback(err);
        if (self._fetchedAll) {
          self._row = null;
          self._rowNum++;
          if (self._cache)
            self._cache.next();
          return doCallback();
        }
        setImmediate(function() {
          moveForward();
        });
      });
    };

    moveForward();
  });
};
