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
const Readable = require('stream').Readable;
const promisify = require('putil-promisify');
const defineConst = require('putil-defineconst');
const extensions = require('../extensions');

/**
 * Expose `CursorStream`.
 */

module.exports = CursorStream;

/**
 *
 * @param {Cursor} cursor
 * @param {Object} options
 * @constructor
 */
function CursorStream(cursor, options) {
  Readable.call(this, options);
  options = options || {};
  defineConst(this, {
    _cursor: cursor,
    _objectMode: options.objectMode,
    _outFormat: options.outFormat || 0,
    _limit: options.limit
  });
  defineConst(this, {
    _rowNum: -1,
    _fetchedRows: 0
  }, {
    writable: true,
    enumerable: false
  });
  this.stringify = options.stringify || extensions.stringify || JSON.stringify;
  const self = this;
  this.on('end', function() {
    self.close();
  });
  cursor.once('close', function() {
    self.emit('close');
  });
}

CursorStream.prototype = {
  get isClosed() {
    return this._cursor.isClosed;
  }
};
Object.setPrototypeOf(CursorStream.prototype, Readable.prototype);
CursorStream.prototype.constructor = CursorStream;

/**
 * Closes stream and releases cursor
 *
 * @param {Function} [callback]
 * @return {Promise|undefined}
 * @public
 */
CursorStream.prototype.close = function(callback) {
  const self = this;
  self.pause();
  self.unpipe();

  if (!callback)
    return promisify.fromCallback(function(cb) {
      self.close(cb);
    });

  self._cursor.close(function(err) {
    callback(err);
    if (err && self.listenerCount('error') > 0)
      self.emit('error', err);
  });
};

/**
 * @private
 * @override
 */
CursorStream.prototype._read = function() {
  const cursor = this._cursor;
  if (this._rowNum < 0) {
    this._rowNum = 0;
    const fields = cursor.fields.toObject();
    this.emit('fields', fields);
    if (!this._objectMode) {
      this.push(!this._outFormat ? '[' :
          '{"fields":' + this.stringify(fields) + ', "rows":[');
    }
  }
  const self = this;
  cursor.next(function(err, row) {
    if (err) {
      /* istanbul ignore next */
      if (typeof self.destroy == 'function')
        self.destroy(err);
      else {
        self.close(function() {
          self.emit('error', err);
        });
      }
      return;
    }
    if (!row) {
      if (!self._objectMode) {
        self.push(!self._outFormat ? ']' :
            '], "numRows":' + (self._rowNum) + ', "eof": true}');

      }
    }
    self._rowNum++;
    self.push(!row || self._objectMode ? row || null :
        (self._rowNum > 1 ? ', ' : '') + self.stringify(row));
  });
};
