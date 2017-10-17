/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Expose Module.
 */

module.exports = {
  DatasetCache: DatasetCache,
  MemoryCache: MemoryCache
};

/**
 *
 * @constructor
 * @abstract
 */
function DatasetCache() {
}

const proto = DatasetCache.prototype = {};
proto.constructor = DatasetCache;

/**
 *
 * @param {Number} index
 * @param {Function} callback
 * @abstract
 */
proto.get = function(index, callback) {
};

/**
 *
 * @param {Number} fromRow
 * @param {Number} toRow
 * @param {Function} callback
 */
proto.getRows = function(fromRow, toRow, callback) {
  const self = this;
  const result = [];
  const x = fromRow < toRow ? 1 : -1;
  var c = Math.abs(fromRow - toRow) + 1;

  function more() {
    self.get(fromRow, function(err, row) {
      if (err)
        return callback(err);
      fromRow += x;
      result.push(row);
      if (--c)
        process.nextTick(more);
      else callback(undefined, result);
    });
  }

  more();
};

/**
 *
 * @param {Number} index
 * @param {Array|Object} row
 * @abstract
 */
proto.set = function(index, row) {
};

/**
 *
 * @param {Array} rows
 * @constructor
 */
function MemoryCache(rows) {
  DatasetCache.call(this);
  this._rows = rows || {};
}

const proto2 = MemoryCache.prototype = {};
Object.setPrototypeOf(proto2, DatasetCache.prototype);
proto2.constructor = MemoryCache;

proto2.get = function(rowNum, callback) {
  callback(undefined, this._rows[rowNum - 1]);
};

proto2.getRows = function(fromRow, toRow, callback) {
  var i = 0;
  const x = fromRow < toRow ? 1 : -1;
  var c = Math.abs(fromRow - toRow) + 1;
  const result = [];
  const isarr = Array.isArray(this._rows);
  while (c) {
    if (isarr && (fromRow < 1 || fromRow > this._rows.length))
      break;
    const row = this._rows[fromRow - 1];
    if (!row)
      break;
    result[i++] = row;
    fromRow += x;
    c--;
  }
  callback(undefined, result.length ? result : undefined);
};

proto2.set = function(rowNum, row) {
  this._rows[rowNum - 1] = row;
};
