/* eslint-disable */

module.exports = TestConnection;

function TestConnection() {
  this._rowidx = 0;
  this._data = require('./test_data_obj.json');
  const rowsarr = this._rowsarr = [];
  const keys = Object.getOwnPropertyNames(this._data.rows[0]);
  this._data.rows.forEach(function(src) {
    var row = [];
    keys.forEach(function(key) {
      row.push(src[key]);
    });
    rowsarr.push(row);
  });
}

const proto = TestConnection.prototype = {
  get isClosed() {
    return this._closed;
  }
};
proto.constructor = TestConnection;

proto.close = function(callback) {
  this._closed = true;
  callback();
};

proto.execute = function(sql, params, options, callback) {

  if (this.isClosed) {
    callback(new Error('Can not execute while connection is closed'));
    return;
  }

  if (sql.indexOf('error') >= 0)
    return callback(new Error('Test error'));
  const out = {metaData: this._data.metaData};
  const fetchRows = options.fetchRows || 100;
  const rows = options.objectRows ? this._data.rows.slice(this._rowidx, fetchRows) :
      this._rowsarr.slice(this._rowidx, fetchRows);
  this._rowidx += rows.length;
  if (options.cursor) {
    out.cursor = new TestCursor(this, rows);
  } else out.rows = rows;

  callback(undefined, out);

};

//noinspection JSUnusedGlobalSymbols
proto.commit = function(callback) {
  callback();
};

//noinspection JSUnusedGlobalSymbols
proto.rollback = function(callback) {
  callback();
};

function TestCursor(conn, rows) {
  this.conn = conn;
  this._rows = rows;
  this._rownum = 0;
}

const proto2 = TestCursor.prototype = {
  get rowNum() {
    return this._rownum;
  }
};
proto2.constructor = TestCursor;

proto2.close = function(callback) {
  callback();
};

proto2.fetch = function(fromRow, toRow, callback) {
  const self = this;
  if (fromRow - 1 > self.rowNum) {
    self.seek(fromRow - self.rowNum - 1, function(err) {
      if (err)
        return callback(err);
      const c = toRow - self._rownum;
      self._fetchRows(c, function(err, rows) {
        callback(err, rows);
      });
    });
  } else {
    const c = toRow - fromRow + 1;
    self._fetchRows(c, function(err, rows) {
      callback(err, rows);
    });
  }
};

proto2.seek = function(step, callback) {
  this._rownum += step;
  assert(this._rownum >= 0);
  callback();
};

proto2._fetchRows = function(nRows, callback) {
  callback(undefined, this._rows.slice(this._rownum, this._rownum + nRows));
};

