/* eslint-disable */

module.exports = {
  createConnector: function(cfg) {
    if (cfg.dialect === 'test') {
      return function(callback) {
        callback(undefined, new TestConnection(cfg));
      };
    }
  }
};

var sessionId = 0;
const data = {};

function fillTable(tableName) {
  var obj = require('./test_data_' + tableName + '.json');
  data[tableName] = {
    metaData: obj.metaData,
    obj: obj.rows,
    arr: []
  };
  var rowsarr = data[tableName].arr;
  const keys = Object.getOwnPropertyNames(obj.rows[0]);
  obj.rows.forEach(function(src) {
    var row = [];
    keys.forEach(function(key) {
      row.push(src[key] || null);
    });
    rowsarr.push(row);
  });
}

fillTable('table1');

/**
 *
 * @param cfg
 * @constructor
 */
function TestConnection(cfg) {
  this.sessionId = ++sessionId;
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

  if (sql === 'select 1')
    return callback(undefined, {rows: []});

  const m = sql.match(/\bfrom (\w+)\b/i);

  if (!(m && m[1]))
    return callback(new Error('Invalid query'));

  const o = data[m[1]];
  if (!o)
    return callback(new Error('Table unknown (' + m[1] + ')'));
  const out = {metaData: o.metaData};
  const fetchRows = options.fetchRows || 100;
  const rows = options.objectRows ?
      o.obj.slice(0, fetchRows) :
      o.arr.slice(0, fetchRows);
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

//noinspection JSUnusedGlobalSymbols
proto.test = function(callback) {
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

