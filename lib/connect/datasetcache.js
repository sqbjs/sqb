/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * @interface
 * @public
 */

class DatasetCache {

  constructor() {
  }

  get(index, callback) {
  }

  getRows(fromRow, toRow, callback) {
    const self = this;
    const result = [];
    let i = 0;
    const x = fromRow < toRow ? 1 : -1;
    let c = Math.abs(fromRow - toRow) + 1;

    function more() {
      self.get(fromRow, (err, row) => {
        if (err)
          return callback(err, rows);
        fromRow += x;
        result.push(row);
        if (--c)
          process.nextTick(() => more());
        else callback(undefined, result);
      });
    }

    more();
  }

  set(index, row) {
  }

}

/**
 * @class
 * @public
 */
class MemoryCache extends DatasetCache {

  constructor(rows) {
    super();
    this._rows = rows || {};
  }

  get(rowNum, callback) {
    callback(undefined, this._rows[rowNum - 1]);
  }

  getRows(fromRow, toRow, callback) {
    let i = 0;
    const x = fromRow < toRow ? 1 : -1;
    let c = Math.abs(fromRow - toRow) + 1;
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
  }

  set(rowNum, row) {
    this._rows[rowNum - 1] = row;
  }
}

module.exports = {
  DatasetCache,
  MemoryCache
};
