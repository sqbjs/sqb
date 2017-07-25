/* eslint-disable */

class TestConnection {

  constructor() {
    this._rowidx = 0;
    this._data = require('./test_data_obj.json');
    const rowsarr = this._rowsarr = [];
    const keys = Object.getOwnPropertyNames(this._data.rows[0]);
    for (let src of this._data.rows) {
      let row = [];
      for (const key of keys) {
        row.push(src[key]);
      }
      rowsarr.push(row);
    }
  }

  /**
   * @override
   * @return {boolean}
   */
  get isClosed() {
    return this._closed;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  close(callback) {
    this._closed = true;
    callback();
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param sql
   * @param params
   * @param options
   * @param callback
   * @private
   */
  execute(sql, params, options, callback) {

    if (this.isClosed) {
      callback(new Error('Can not execute while connection is closed'));
      return;
    }

    if (sql.includes('error'))
      return callback(new Error('Test error'));
    const out = {metaData: this._data.metaData};
    const fetchRows = options.fetchRows || 100;
    let rows = options.objectRows ? this._data.rows.slice(this._rowidx, fetchRows) :
        this._rowsarr.slice(this._rowidx, fetchRows);
    this._rowidx += rows.length;
    if (options.cursor) {
      out.cursor = new TestCursor(this, rows);
    } else out.rows = rows;

    callback(undefined, out);

  }

  //noinspection JSUnusedGlobalSymbols
  commit(callback) {
    callback();
  }

  //noinspection JSUnusedGlobalSymbols
  rollback(callback) {
    callback();
  }

}

class TestCursor {

  constructor(conn, rows) {
    this.conn = conn;
    this._rows = rows;
    this._rownum = 0;
  }

  get rowNum() {
    return this._rownum;
  }

  close(callback) {
    callback();
  }

  fetch(fromRow, toRow, callback) {
    const self = this;
    if (fromRow - 1 > self.rowNum) {
      self.seek(fromRow - self.rowNum - 1, (err) => {
        if (err)
          return callback(err);
        const c = toRow - self._rownum;
        self._fetchRows(c, (err, rows) => callback(err, rows));
      });
    } else {
      const c = toRow - fromRow + 1;
      self._fetchRows(c, (err, rows) => callback(err, rows));
    }
  }

  seek(step, callback) {
    this._rownum += step;
    assert(this._rownum >= 0);
    callback();
  }

  _fetchRows(nRows, callback) {
    callback(undefined, this._rows.slice(this._rownum, this._rownum + nRows));
  }

}

module.exports = TestConnection;