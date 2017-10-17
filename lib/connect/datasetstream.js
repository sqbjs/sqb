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
const Promisify = require('putil-promisify');
const assert = require('assert');
const plugins = require('../plugins');

/**
 *
 * @param {Dataset} dataset
 * @param {Object} options
 * @constructor
 */
function DatasetStream(dataset, options) {
  Readable.call(this, options);
  const self = this;
  options = options || {};
  self._rowNum = 0;
  self._closed = false;
  self._dataset = dataset;
  self._objectMode = options.objectMode;
  self._limit = options.limit;
  self.stringify = options.stringify || plugins.stringify || JSON.stringify;
  self._metaData = options.metaData !== undefined ? options.metaData : true;
  self._summary = options.summary !== undefined ? options.summary : true;
  self._mode = 0;
  if (options.mode) {
    assert(options.mode === 0 || options.mode === 1 ||
        options.mode === 'default' || options.mode === 'basic');
    this._mode = options.mode === 1 || options.mode === 'basic' ? 1 : 0;
  }
  self.on('end', self.close.bind(self));
  dataset.once('close', function() {
    self.emit('close');
  });
  dataset.on('error', function(err) {
    self.emit('error', err);
  });
}

const proto = DatasetStream.prototype = {
  get isClosed() {
    return this._closed || this._dataset.isClosed;
  }
};
Object.setPrototypeOf(proto, Readable.prototype);
proto.constructor = DatasetStream;

/**
 * Closes stream and releases cursor
 *
 * @param {Function} [callback]
 * @return {Promise|undefined}
 * @public
 */
proto.close = function(callback) {
  const self = this;
  self.pause();
  self.unpipe();

  if (!callback)
    return Promisify.fromCallback(function(cb) {
      self.close(cb);
    });

  if (self._dataset.isClosed) {
    if (callback)
      callback();
    return;
  }

  self._dataset.close(function(err) {
    if (callback)
      callback(err);
    if (err)
      self.emit('error', err);
  });
};

//noinspection JSUnusedGlobalSymbols
/**
 * @private
 * @override
 */
proto._read = function() {
  const self = this;

  try {

    if (self.isClosed) {
      self.push(null);
      return;
    }
    var s;
    if (self._rowNum === 0) {
      self._rowNum++;
      s = '';
      if (self._metaData) {
        const meta = self._dataset.metaData.asObject({fieldNaming: self._fieldNaming});
        self.emit('metaData', meta);
        if (!self._objectMode && self._mode === 0)
          s = '"metaData":' + self.stringify(meta) + ', ';
      }
      if (!self._objectMode) {
        self.push(self._mode === 0 ? '{' + s + '"rows":[' : '[');
        return;
      }
    }

    var numRows = self._dataset._prefetchRows || 100;
    if (self._limit)
      numRows = Math.min(numRows, self._limit - self._rowNum + 1);

    if (self._fetchedAll || numRows <= 0) {
      if (!self._closed) {
        self._closed = true;
        if (self._summary) {
          const summary = {
            numRows: self._rowNum - 1,
            eof: !!self._dataset.isEof
          };
          self.emit('summary', summary);
          if (!self._objectMode) {
            if (self._mode === 0) {
              s = self.stringify(summary);
              s = s.substring(1, s.length - 1);
              s = s ? ',' + s : '';
              self.push(']' + s + '}');
            } else self.push(']');
          }
        } else if (!self._objectMode) self.push(']');
      }
      self.push(null);
      return;
    }

    if (self._fetchedRows && self._fetchedRows.length) {
      self._pushRow(self._fetchedRows.shift());

    } else {
      self._dataset.next(numRows, function(err, more, rows) {
        if (err || self._closed)
          return self.destroy(err);

        self._fetchedRows = rows;
        if (!rows) {
          self._fetchedAll = true;
          self._read(); // eof reached
        } else
          self._pushRow(self._fetchedRows.shift());
      });
    }
  } catch (e) {
    self.destroy(e);
  }
};

proto._pushRow = function(row) {
  const self = this;
  self._rowNum++;
  if (self._objectMode)
    self.push(row);
  else {
    self.push((self._rowNum > 2 ? ', ' : '') + self.stringify(row));
  }
};
