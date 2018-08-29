/* eslint-disable */

const TestMetaOperator = require('./test_metaoperator');

let sessionId = 0;
const data = {};

module.exports = {
  createAdapter: function(cfg) {
    if (cfg.dialect === 'test') {
      return {
        createConnection: function() {
          if (module.exports.errorCreateConnection)
            return Promise.reject(new Error('Any error'));
          return Promise.resolve(new TestConnection(cfg));
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
  const obj = require('./db/' + tableName + '.json');
  data[tableName] = {
    fields: obj.fields,
    obj: obj.rows,
    arr: []
  };
  if (tableName === 'airports')
    for (const t of obj.rows) {
      t.datevalue = new Date();
    }
  const rowsarr = data[tableName].arr;
  for (const src of obj.rows) {
    const row = [];
    for (const [idx, key] of obj.fields.entries()) {
      if (idx < 13)
        row.push(src[key.name] || null);
    }
    rowsarr.push(row);
  }
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
class TestConnection {
  constructor(cfg) {
    this.sessionId = ++sessionId;
  }

  get isClosed() {
    return this._closed;
  }

  close() {
    this._closed = true;
    return Promise.resolve();
  }

  execute(query, options) {

    if (this.isClosed)
      return Promise.reject(new Error('Can not execute while connection is closed'));

    let sql = query.sql;

    if (sql.substring(0, 6) === 'select') {
      if (sql === 'select 1')
        return Promise.resolve({rows: []});

      const m = sql.match(/\bfrom (\w+)\b/i);
      if (!(m && m[1]))
        return Promise.reject(new Error('Invalid query'));

      const o = data[m[1]];
      if (!o)
        return Promise.reject(new Error('Table unknown (' + m[1] + ')'));
      const out = {fields: o.fields.slice()};
      // Clone records
      let i;
      let len = Math.min(o.obj.length, options.fetchRows ? options.fetchRows : o.obj.length);
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
      return Promise.resolve(out);
    }
    if (sql.substring(0, 6) === 'insert') {
      if (sql.includes('returning'))
        return Promise.resolve({returns: {ID: 1}});
      return Promise.resolve({});
    }
    if (sql.substring(0, 6) === 'update') {
      if (sql.includes('returning'))
        return Promise.resolve({returns: {ID: 1}});
      return Promise.resolve({});
    }
    if (sql.substring(0, 6) === 'delete')
      return Promise.resolve({});

    if (sql.substring(0, 6) === 'merge')
      return Promise.resolve({});

    if (sql === 'no response')
      return Promise.resolve();

    return Promise.reject(new Error('Unknown test SQL'));
  }

  commit() {
    return Promise.resolve();
  }

  startTransaction() {
    return Promise.resolve();
  }

  rollback() {
    return Promise.resolve();
  }

  test() {
    this._tested = (this._tested || 0) + 1;
    return Promise.resolve();
  }

  get(param) {
    if (param === 'server_version')
      return '12.0';
  }
}

/**
 *
 * @param conn
 * @param rows
 * @constructor
 */
class TestCursor {
  constructor(conn, rows) {
    this._rows = rows;
    this._rowNum = 0;
  }

  close() {
    return Promise.resolve();
  }

  fetch(rowCount) {
    if (!rowCount)
      return Promise.resolve();
    const rowNum = this._rowNum;
    this._rowNum += rowCount;
    return Promise.resolve(this._rows.slice(rowNum, this._rowNum));
  }

}

