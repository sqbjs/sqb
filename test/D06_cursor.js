/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');
const testAdapter = require('./support/test_adapter');
const airports = testAdapter.data.airports;

describe('Cursor', function() {

  var pool;
  var cursor;
  before(function() {
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

  after(function() {
    pool.close(true);
  });

  it('should return Cursor for select queries', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      try {
        assert(!err, err);
        cursor = result && result.cursor;
        assert(cursor);
        assert.equal(cursor.isBof, true);
      } catch (e) {
        return done(e);
      }
      cursor.close(done);
    });
  });

  it('should cursor.fields property return FieldCollection', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      try {
        assert(!err, err);
        cursor = result && result.cursor;
        assert(cursor);
        assert(cursor.fields);
        assert(cursor.fields.get('id'));
      } catch (e) {
        return done(e);
      }
      cursor.close(done);
    });
  });

  it('should close', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result.cursor;
      cursor.on('close', function() {
        done();
      });
      cursor.close();
    });
  });

  it('should close (Promise)', function() {
    return pool.select().from('airports').then(function(result) {
      return result.cursor.close();
    });
  });

  it('should handle close error', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result.cursor;
      //var oldClose = Object.getPrototypeOf(cursor._cursor).close;
      cursor._cursor.close = function(cb) {
        cb(new Error('Any error'));
      };
      cursor.close(function(err) {
        delete cursor._cursor.close;
        if (err)
          return cursor.close(done);
        done(new Error('Failed'));
        oldClose();
      });
    });
  });

  it('should cache rows', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      var k = 0;
      cursor.cached();
      cursor.next(function(err, row, more) {
        try {
          assert(!err, err);
          assert.equal(cursor.isBof, false);
          if (row) {
            assert.equal(typeof more, 'function');
            assert.equal(typeof row, 'object');
            assert.equal(Array.isArray(row), true);
            assert.equal(row[0], airports.arr[k++][0]);
            assert.equal(cursor.rowNum, k);
            return more();
          }
          assert.equal(cursor.rowNum, cursor._cache.length + 1);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should not enable cache after fetch', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.next(function(err, row, more) {
        try {
          cursor.cached();
        } catch (e) {
          return cursor.close(done);
        }
        done(new Error('Failed'));
        cursor.close();
      });
    });
  });

  it('should seek() move cursor', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      var moveRowNum;
      cursor.on('move', function(row, rowNum) {
        moveRowNum = rowNum;
      });
      const airports = testAdapter.data.airports;
      cursor.seek(10, function(err, row, rowNum) {
        try {
          assert(!err, err);
          assert.equal(cursor.isBof, false);
          assert(cursor.connection);
          assert.equal(typeof row, 'object');
          assert.equal(Array.isArray(row), true);
          assert.equal(rowNum, 10);
          assert.equal(row[0], airports.arr[rowNum - 1][0]);
          assert.equal(cursor.rowNum, rowNum);
          assert.equal(cursor.rowNum, moveRowNum);
          assert.equal(cursor.row, row);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should seek(10000) move cursor to eof', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.seek(10000, function(err, row, rowNum) {
        try {
          assert(!err, err);
          assert.equal(cursor.isBof, false);
          assert.equal(cursor.isEof, true);
          assert(!row);
          assert.equal(rowNum, airports.arr.length + 1);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should seek(10000) move cursor to eof (cached)', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor.seek(10000, function(err, row, rowNum) {
        try {
          assert(!err, err);
          assert.equal(cursor.isBof, false);
          assert.equal(cursor.isEof, true);
          assert(!row);
          assert.equal(rowNum, airports.arr.length + 1);
          assert.equal(cursor._cache.length, airports.arr.length);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should seek() move cursor back', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor.seek(10000, function(err, row, rowNum) {
        try {
          assert(!err, err);
          assert.equal(cursor.isEof, true);
        } catch (e) {
          return done(e);
        }
        cursor.seek(-(rowNum - 1), function(err, row, rowNum) {
          try {
            assert(!err, err);
            assert.equal(cursor.isBof, false);
            assert.equal(cursor.isEof, false);
            assert(row);
            assert.equal(cursor.rowNum, 1);
          } catch (e) {
            return done(e);
          }
          cursor.close(done);
        });
      });
    });
  });

  it('should seek() move cursor back (Promise)', function() {
    return pool.select().from('airports').then(function(result) {
      cursor = result && result.cursor;
      cursor.cached();
      return cursor.seek(10000).then(function(row) {
        assert(!row);
        assert.equal(cursor.isEof, true);
        return cursor.seek(-(cursor.rowNum - 1)).then(function(row) {
          assert.equal(cursor.isBof, false);
          assert.equal(cursor.isEof, false);
          assert(row);
          assert.equal(cursor.rowNum, 1);
          return cursor.close();
        });
      });
    });
  });

  it('should seek(0) do nothing', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      const rn = cursor.rowNum;
      cursor.seek(0, function(err, row, rowNum) {
        try {
          assert(!err, err);
          assert.equal(rn, rowNum);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should not seek(-1) if cache not enabled', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.seek(-1, function(err, row, rowNum) {
        cursor.close();
        if (err)
          return done();
        done(new Error('Failed'));
      });
    });
  });

  it('should seek() handle errors', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor._cursor.fetch = function(nRows, cb) {
        cb(new Error('Any error'));
      };
      cursor.fetchAll(function(err) {
        assert(err);
        delete cursor._cursor.fetch;
        cursor._cursor.close = function(cb) {
          cb(new Error('Any error'));
        };
        cursor.fetchAll(function(err) {
          assert(err);
          delete cursor._cursor.close;
          cursor.close(done);
        });
      });
    });
  });

  it('should fetchAll() fetch all records and emit eof', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      var eofCalled;
      cursor.on('eof', function() {
        eofCalled = true;
      });
      var moveCalled;
      cursor.on('move', function(row, rowNum) {
        moveCalled = true;
      });
      cursor.fetchAll(function(err) {
        assert(eofCalled);
        assert(!moveCalled);
        cursor.close(done);
      });
    });
  });

  it('should fetchAll() fetch all records and emit eof (Promise)', function() {
    return pool.select().from('airports').then(function(result) {
      cursor = result && result.cursor;
      cursor.cached();
      var ok;
      cursor.on('eof', function() {
        ok = true;
      });
      return cursor.fetchAll().then(function() {
        assert(ok);
        return cursor.close();
      });
    });
  });

  it('should not call fetchAll() if cache not enabled', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.fetchAll(function(err) {
        assert(err);
        cursor.close(done);
      });
    });
  });

  it('should fetchAll() handle errors', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor._seek = function(step, cb) {
        cb(new Error('Any error'));
      };
      cursor.fetchAll(function(err) {
        assert(err);
        cursor._seek = function(step, cb) {
          if (step < 0)
            return cb(new Error('Any error'));
          Object.getPrototypeOf(cursor)._seek.call(cursor, step, cb);
        };
        cursor.fetchAll(function(err) {
          assert(err);
          cursor.close(done);
        });
      });
    });
  });

  it('should auto close cursor after fetch all rows', function() {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      var ok;
      cursor.on('close', function() {
        ok = true;
      });
      cursor.fetchAll(function(err) {
        assert(ok);
        const airports = testAdapter.data.airports;
        var k = 0;
        cursor.next(function(err, row, more) {
          try {
            assert(!err, err);
            if (row) {
              assert.equal(row[0], airports.arr[k][0]);
              assert.equal(cursor.rowNum, ++k);
              assert.equal(cursor.row, row);
              return more();
            }
          } catch (e) {
            return done(e);
          }
          done();
        });
      });
    });
  });

  it('should moveTo() move cursor given record', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor.moveTo(100, function(err, row, rowNum) {
        try {
          assert(!err, err);
          assert.equal(rowNum, 100);
          cursor.moveTo(50, function(err, row, rowNum) {
            try {
              assert(!err, err);
              assert.equal(rowNum, 50);
            } catch (e) {
              return done(e);
            }
            cursor.close(done);
          });
        } catch (e) {
          return done(e);
        }
      });
    });
  });

  it('should next() iterate over rows', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      const airports = testAdapter.data.airports;
      var k = 0;
      cursor.next(function(err, row, more) {
        try {
          assert(!err, err);
          assert.equal(cursor.isBof, false);
          if (row) {
            assert.equal(typeof more, 'function');
            assert.equal(typeof row, 'object');
            assert.equal(Array.isArray(row), true);
            assert.equal(row[0], airports.arr[k][0]);
            assert.equal(cursor.rowNum, ++k);
            assert.equal(cursor.row, row);
            return more();
          }
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should next() iterate over rows (objectRows = true)', function(done) {
    pool.select().from('airports').execute({
      objectRows: true
    }, function(err, result) {
      const cursor = result && result.cursor;
      const airports = testAdapter.data.airports;
      var k = 0;
      cursor.next(function(err, row, more) {
        try {
          assert(!err, err);
          assert.equal(cursor.isBof, false);
          if (k < airports.arr.length) {
            assert.equal(typeof more, 'function');
            assert.equal(typeof row, 'object');
            assert.equal(Array.isArray(row), false);
            assert.equal(row.ID, airports.obj[k++].ID);
            assert.equal(cursor.rowNum, k);
            return more();
          }
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should next() iterate over rows (Promise)', function() {
    return pool.select().from('airports').then(function(result) {
      cursor = result && result.cursor;
      const airports = testAdapter.data.airports;
      return cursor.next().then(function(row) {
        assert.equal(cursor.isBof, false);
        assert.equal(typeof row, 'object');
        assert.equal(Array.isArray(row), true);
        assert.equal(row[0], airports.arr[0][0]);
        assert.equal(cursor.rowNum, 1);
        return cursor.close();
      });
    });
  });

  it('should next() handle errors', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor._seek = function(step, cb) {
        cb(new Error('Any error'));
      };
      cursor.next(function(err) {
        assert(err);
        cursor.close(done);
      });
    });
  });

  it('should prev() iterate over rows', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      const airports = testAdapter.data.airports;
      var k;
      cursor.seek(10000, function(err) {
        k = cursor.rowNum;
        cursor.prev(function(err, row, more) {
          try {
            if (--k > 0) {
              assert.equal(typeof more, 'function');
              assert.equal(typeof row, 'object');
              assert.equal(Array.isArray(row), true);
              assert.equal(cursor.rowNum, k);
              assert.equal(row[0], airports.arr[k - 1][0]);
              assert.equal(cursor.row, row);
              return more();
            }
          } catch (e) {
            return done(e);
          }
          cursor.close(done);
        });
      });
    });
  });

  it('should prev() move cursor back (Promise)', function() {
    return pool.select().from('airports').then(function(result) {
      cursor = result && result.cursor;
      cursor.cached();
      const airports = testAdapter.data.airports;
      var k;
      return cursor.seek(10000).then(function() {
        return cursor.prev().then(function(row) {
          assert.equal(typeof row, 'object');
          assert.equal(Array.isArray(row), true);
          assert.equal(cursor.rowNum, airports.arr.length);
          assert.equal(row[0], airports.arr[cursor.rowNum - 1][0]);
          assert.equal(cursor.row, row);
          return cursor.close();
        });
      });
    });
  });

  it('should prev() handle errors', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor._seek = function(step, cb) {
        cb(new Error('Any error'));
      };
      cursor.prev(function(err) {
        assert(err);
        cursor.close(done);
      });
    });
  });

  it('should reset cursor in cached mode', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.cached();
      cursor.next(function(err, row, more) {
        try {
          assert(!err, err);
          assert.equal(cursor.rowNum, 1);
          cursor.reset();
          assert.equal(cursor.rowNum, 0);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should not reset cursor if cache is not enabled', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.next(function(err, row, more) {
        try {
          cursor.reset();
        } catch (e) {
          cursor.close(done);
          return;
        }
        done(new Error('Failed'));
      });
    });
  });

  it('should get() return field value', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      const airports = testAdapter.data.airports;
      cursor.next(function(err, row, more) {
        try {
          assert.equal(cursor.get('id'), airports.arr[0][0]);
          assert.equal(cursor.get('ID'), airports.arr[0][0]);
          assert.equal(cursor.get('TestNoValue'), null);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should get() return field value (objectRows = true)', function(done) {
    pool.select().from('airports').execute({
      objectRows: true
    }, function(err, result) {
      cursor = result && result.cursor;
      const airports = testAdapter.data.airports;
      cursor.next(function(err, row, more) {
        try {
          assert.equal(cursor.get('id'), airports.arr[0][0]);
          assert.equal(cursor.get('ID'), airports.arr[0][0]);
          assert.equal(cursor.get('TestNoValue'), null);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should get() throw error if field not found', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.next(function(err, row, more) {
        try {
          cursor.get('id2');
        } catch (e) {
          return cursor.close(done);
        }
        done(new Error('Failed'));
      });
    });
  });

  it('should get() return undefined if no row located', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      try {
        assert.equal(cursor.get('id'), undefined);
      } catch (e) {
        return done(e);
      }
      cursor.close(done);
    });
  });

  it('should set() update field value', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      var k = 0;
      cursor.next(function(err, row, more) {
            if (++k < 90)
              return more();
            try {
              const d = Date.now();
              cursor.set('TestNoValue', d);
              assert.equal(cursor.get('TestNoValue'), d);
            } catch (e) {
              return done(e);
            }
            cursor.close(done);
          }
      );
    });
  });

  it('should set() update field value (objectRows = true)', function(done) {
    pool.select().from('airports').execute({
      objectRows: true
    }, function(err, result) {
      cursor = result && result.cursor;
      var k = 0;
      cursor.next(function(err, row, more) {
        if (++k < 100)
          return more();
        try {
          const d = Date.now();
          cursor.set('TestNoValue', d);
          assert.equal(cursor.get('TestNoValue'), d);
        } catch (e) {
          return done(e);
        }
        cursor.close(done);
      });
    });
  });

  it('should set() throw error if field not found', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.next(function(err, row, more) {
        try {
          cursor.set('id2', 0);
        } catch (e) {
          return cursor.close(done);
        }
        done(new Error('Failed'));
      });
    });
  });

  it('should set() throw error if Bof', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      try {
        assert.equal(cursor.isBof, true);
        cursor.set('TestNoValue', 0);
      } catch (e) {
        return cursor.close(done);
      }
      done(new Error('Failed'));
    });
  });

  it('should set() throw error if Eof', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.next(function(err, row, more) {
        if (row)
          return more();
        try {
          assert.equal(cursor.isEof, true);
          cursor.set('TestNoValue', 0);
        } catch (e) {
          return cursor.close(done);
        }
        done(new Error('Failed'));
      });
    });
  });

  it('should call queries `fetch` events on fetching new rows', function(done) {
    var l = 0;
    pool.select().from('airports')
        .on('fetch', function(row) {
          l++;
        })
        .execute(function(err, result) {
          if (err)
            return done(err);
          cursor = result && result.cursor;
          const airports = testAdapter.data.airports;
          var k = 0;
          cursor.next(function(err, row, more) {
            try {
              assert(!err, err);
              assert.equal(cursor.isBof, false);
              if (row) {
                assert.equal(typeof more, 'function');
                assert.equal(typeof row, 'object');
                assert.equal(Array.isArray(row), true);
                assert.equal(row[0], airports.arr[k][0]);
                assert.equal(cursor.rowNum, ++k);
                assert.equal(cursor.row, row);
                return more();
              }
              assert.equal(l, cursor._fetchedRows);
            } catch (e) {
              return done(e);
            }
            cursor.close(done);
          });
        });
  });

  it('should not fetch rows if closed', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      cursor = result && result.cursor;
      cursor.close(function() {
        cursor.next(function(err) {
          if (err)
            return done();
          done(new Error('Failed'));
        });
      });
    });
  });

  it('shutdown pool', function(done) {
    if (cursor && !cursor.isClosed) {
      cursor.close();
      return done(new Error('One of created cursors is already open'));
    }
    pool.close(done);
  });

});