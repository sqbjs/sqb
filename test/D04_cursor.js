/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');
const testAdapter = require('./support/test_adapter');
const airports = testAdapter.data.airports;

describe('Cursor', function() {

  let pool;
  let cursor;
  before(() => {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      defaults: {
        cursor: true,
        fetchRows: 10
      }
    });
  });

  after(() => pool.close(true));

  it('should return Cursor for select queries', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      assert(cursor);
      assert.strictEqual(cursor.isBof, true);
      assert.strictEqual(cursor.inspect(), '[object Cursor]');
      assert(cursor.connection);
      return cursor.close();
    });
  });

  it('should handle close error', function(done) {
    pool.select().from('airports').execute().then(result => {
      cursor = result.cursor;
      cursor._cursor.close = () => Promise.reject(new Error('Any error'));
      cursor.close()
          .then(() => done(0, 'Failed'))
          .catch(() => {
            delete cursor._cursor.close;
            cursor.close().then(() => done());
          });
    });
  });

  it('should cache rows', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      return cursor.fetchAll().then(() => {
        assert.strictEqual(cursor.isBof, true);
        assert.strictEqual(cursor.rowNum, 0);
        assert(cursor._cache);
        assert.strictEqual(cursor._cache.length, 10);
        return cursor.next().then(row => {
          assert.strictEqual(typeof row, 'object');
          assert.deepStrictEqual(row, airports.obj[0]);
          return cursor.close();
        });
      });
    });
  });

  it('should cache can not be enabled after fetch', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      return cursor.next().then(() => {
        try {
          cursor.cached();
        } catch (e) {
          return cursor.close();
        }
        throw new Error('Failed');
      });
    });
  });

  it('should seek() move cursor', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      let currow;
      cursor.on('move', (rowNum) => {
        currow = rowNum;
      });
      const airports = testAdapter.data.airports;
      return cursor.seek(10).then((num) => {
        assert.strictEqual(cursor.isBof, false);
        assert.strictEqual(num, 10);
        assert.strictEqual(cursor.rowNum, num);
        assert.deepStrictEqual(cursor.row, airports.obj[num - 1]);
        assert.strictEqual(cursor.rowNum, currow);
        return cursor.close();
      });
    });
  });

  it('should seek(10000) move cursor to eof', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      return cursor.seek(10000).then(() => {
        assert.strictEqual(cursor.isBof, false);
        assert.strictEqual(cursor.isEof, true);
        assert(!cursor.row);
        assert.strictEqual(cursor.rowNum, 11);
        return cursor.close();
      });
    });
  });

  it('should seek(10000) move cursor to eof (cached)', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      return cursor.seek(10000).then(() => {
        assert.strictEqual(cursor.isBof, false);
        assert.strictEqual(cursor.isEof, true);
        assert(!cursor.row);
        assert.strictEqual(cursor.rowNum, 11);
        assert.strictEqual(cursor._cache.length, 10);
        return cursor.close();
      });
    });
  });

  it('should move cursor back', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      cursor.seek(10000).then(() => {
        assert.strictEqual(cursor.isEof, true);
        cursor.moveTo(1).then((num) => {
          assert.strictEqual(cursor.isBof, false);
          assert.strictEqual(cursor.isEof, false);
          assert.strictEqual(cursor.rowNum, 1);
          assert.strictEqual(cursor.rowNum, num);
          return cursor.close();
        });
      });
    });
  });

  it('should seek(0) do nothing', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      const rn = cursor.rowNum;
      cursor.seek(0).then(num => {
        assert.strictEqual(rn, num);
        return cursor.close();
      });
    });
  });

  it('should handle adapter errors', function(done) {
    pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      cursor._cursor.fetch = () => Promise.reject('Any error');
      cursor.fetchAll()
          .then(() => done('Failed'))
          .catch(() => {
            cursor.close().then(() => done());
          });
    });
  });

  it('should fetchAll() emit eof', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      let eofCalled;
      cursor.on('eof', () => eofCalled = true);
      let moveCalled;
      cursor.on('move', () => {
        moveCalled = true;
      });
      return cursor.fetchAll().then(() => {
        assert(eofCalled);
        assert(!moveCalled);
        return cursor.close();
      });
    });
  });

  it('should close cursor after fetched all rows', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      let ok;
      cursor.on('close', () => ok = true);
      return cursor.fetchAll().then(() => {
        assert(ok);
        const airports = testAdapter.data.airports;
        return cursor.next().then((row) => {
          assert.deepStrictEqual(row, airports.obj[0]);
        });
      });
    });
  });

  it('should moveTo() move cursor given record', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      return cursor.moveTo(9).then(rowNum => {
        assert.strictEqual(rowNum, 9);
        return cursor.moveTo(5).then(rowNum => {
          assert.strictEqual(rowNum, 5);
          return cursor.close();
        });
      });
    });
  });

  it('should reset cursor in cached mode', function() {
    return pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.cached();
      return cursor.next().then(() => {
        assert.strictEqual(cursor.rowNum, 1);
        cursor.reset();
        assert.strictEqual(cursor.rowNum, 0);
        return cursor.close();
      });
    });
  });

  it('should not reset cursor if cache is not enabled', function(done) {
    pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.next().then(() => {
        try {
          cursor.reset();
          done('Failed');
        } catch (e) {
          cursor.close().then(() => done());
        }
      });
    });
  });

  it('should queries call `fetch` events on fetching new rows', function() {
    let l = 0;
    return pool.select().from('airports')
        .on('fetch', () => l++)
        .execute().then((result) => {
          cursor = result && result.cursor;
          cursor.seek(10).then(() => {
            assert.strictEqual(cursor.rowNum, 10);
            assert.strictEqual(cursor.rowNum, l);
            assert.strictEqual(cursor._fetchedRows, l);
            return cursor.close();
          });
        });
  });

  it('should not fetch rows if closed', function(done) {
    pool.select().from('airports').execute().then(result => {
      cursor = result && result.cursor;
      cursor.close().then(() => {
        cursor.next().then(() => done('Failed')).catch(() => done());
      });
    });
  });

  describe('Finalize', function() {
    it('should have no active connection after all tests', function() {
      assert.strictEqual(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });
  });

});
