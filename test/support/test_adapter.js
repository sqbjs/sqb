/* eslint-disable */

const TestMetaOperator = require('./test_metaoperator');

var sessionId = 0;
const data = {};

module.exports = {
  createAdapter: function(cfg) {
    if (cfg.dialect === 'test') {
      return {
        createConnection: function(callback) {
          if (module.exports.errorCreateConnection)
            return callback(new Error('Any error'));
          callback(null, new TestConnection(cfg));
        },
        paramType: 1,
        serverVersion: '2.0'
      };
    }
  },
  createMetaOperator: function(config) {
    if (config.dialect === 'test') {
      return new TestMetaOperator();
    }
  },
  stringify: JSON.stringify,
  data: data
};

function fillTable(tableName) {
  var obj = require('./db/' + tableName + '.json');
  data[tableName] = {
    fields: obj.fields,
    obj: obj.rows,
    arr: []
  };
  if (tableName === 'airports')
    obj.rows.forEach(function(t) {
      t.datevalue = new Date();
    });
  var rowsarr = data[tableName].arr;
  obj.rows.forEach(function(src) {
    var row = [];
    obj.fields.forEach(function(key, idx) {
      if (idx < 13)
        row.push(src[key.name] || null);
    });
    rowsarr.push(row);
  });
}

fillTable('schemas');
fillTable('tables');
fillTable('columns');
fillTable('primary_keys');
fillTable('foreign_keys');
fillTable('airports');

/**
 *
 * @param cfg
 * @constructor
 */
function TestConnection(cfg) {
  this.sessionId = ++sessionId;
}

TestConnection.prototype = {
  get isClosed() {
    return this._closed;
  }
};
TestConnection.prototype.constructor = TestConnection;

TestConnection.prototype.close = function(callback) {
  this._closed = true;
  callback();
};

TestConnection.prototype.execute = function(sql, params, options, callback) {

  if (this.isClosed) {
    callback(new Error('Can not execute while connection is closed'));
    return;
  }

  if (sql.substring(0, 6) === 'select') {
    if (sql === 'select 1')
      return callback(undefined, {rows: []});

    const m = sql.match(/\bfrom (\w+)\b/i);
    if (!(m && m[1]))
      return callback(new Error('Invalid query'));

    const o = data[m[1]];
    if (!o)
      return callback(new Error('Table unknown (' + m[1] + ')'));
    const out = {fields: o.fields.slice()};
    // Clone records
    var i;
    var len = options.fetchRows ? options.fetchRows : o.obj.length;
    const rows = [];
    if (options.objectRows) {
      for (i = 0; i < len; i++)
        rows.push(Object.assign({}, o.obj[i]));
    } else {
      for (i = 0; i < len; i++)
        rows.push(o.arr[i].slice());
    }

    if (options.cursor) {
      out.cursor = new TestCursor(this, rows);
    } else out.rows = rows;
    return callback(null, out);
  }
  if (sql.substring(0, 6) === 'insert') {
    if (sql.includes('returning'))
      return callback(null, {returns: {ID: 1}});
    return callback(null, {});
  }
  if (sql.substring(0, 6) === 'update') {
    if (sql.includes('returning'))
      return callback(null, {returns: {ID: 1}});
    return callback(null, {});
  }
  if (sql.substring(0, 6) === 'delete')
    return callback(null, {});

  if (sql.substring(0, 6) === 'merge')
    return callback(null, {});

  if (sql === 'no response')
    return callback(null);

  return callback(new Error('Unknown test SQL'));
};

TestConnection.prototype.commit = function(callback) {
  callback();
};

TestConnection.prototype.startTransaction = function(callback) {
  callback();
};

TestConnection.prototype.rollback = function(callback) {
  callback();
};

TestConnection.prototype.test = function(callback) {
  this._tested = (this._tested || 0) + 1;
  callback();
};

TestConnection.prototype.get = function(param) {
  if (param === 'server_version')
    return '12.0';
};

/**
 *
 * @param conn
 * @param rows
 * @constructor
 */
function TestCursor(conn, rows) {
  this._rows = rows;
  this._rowNum = 0;
}

TestCursor.prototype.close = function(callback) {
  callback();
};

TestCursor.prototype.fetch = function(rowCount, callback) {
  if (!rowCount)
    return callback();
  const rowNum = this._rowNum;
  this._rowNum += rowCount;
  callback(undefined, this._rows.slice(rowNum, this._rowNum));
};
