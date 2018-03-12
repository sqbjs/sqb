/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');

describe('Connection', function() {

  let pool;
  before(() => {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      pool: {
        validate: true,
        min: 1
      }
    });
  });

  after(() => pool.close(true));

  it('should toString/inspect returns formatted string', function(done) {
    pool.connect((err, conn) => {
      try {
        assert(conn.inspect().match(/\[object Connection\(\d\)]/));
        conn.release();
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should use reference counting for acquire/release operations', function(done) {
    pool.connect((err, conn) => {
      try {
        assert(!err, err);
        assert(conn);
        assert(!conn.isClosed);
        conn.on('close', () => {
          try {
            assert.equal(conn.referenceCount, 0);
          } catch (e) {
            return done(e);
          }
          done();
        });
        assert.equal(conn.referenceCount, 1);
        conn.acquire();
        assert.equal(conn.referenceCount, 2);
        conn.release();
        assert.equal(conn.referenceCount, 1);
        conn.release();
      } catch (e) {
        return done(e);
      }
    });
  });

  it('should not release() more than acquired', function(done) {
    pool.connect((err, conn) => {
      try {
        assert(!err, err);
        assert(conn);
        conn.release();
        try {
          conn.release();
        } catch (e) {
          return done();
        }
        assert(0, 'Failed');
      } catch (e) {
        return done(e);
      }
    });
  });

  it('should startTransaction()', function(done) {
    pool.connect((err, conn) => {
      conn.on('start-transaction', () => done());

      conn.startTransaction(function(err) {
        try {
          assert(!err, err);
        } catch (e) {
          return done(e);
        }
        conn.release();
      });
    });
  });

  it('should startTransaction() (Promise)', function(done) {
    pool.connect().then((conn) => {
      conn.on('start-transaction', () => done());
      conn.startTransaction().then(() => conn.release());
    });
  });

  it('should not start transaction if closed', function(done) {
    pool.connect((err, conn) => {
      conn.on('close', () => {
        conn.startTransaction((err) => {
          try {
            assert(err);
          } catch (e) {
            return done(e);
          }
          done();
        });
      });
      conn.release();
    });
  });

  it('should commit()', function(done) {
    pool.connect((err, conn) => {
      conn.on('commit', () => done());

      conn.commit((err) => {
        try {
          assert(!err, err);
        } catch (e) {
          return done(e);
        }
        conn.release();
      });
    });
  });

  it('should commit() (Promise)', function(done) {
    pool.connect().then((conn) => {
      conn.on('commit', () => done());
      conn.commit().then(() => conn.release());
    });
  });

  it('should commit when returned promise resolved', function(done) {
    pool.connect((err, conn) => {
      conn.on('commit', () => done());
      return new Promise((resolve) => resolve());
    });
  });

  it('should not commit if closed', function(done) {
    pool.connect((err, conn) => {
      conn.on('close', () => {
        conn.commit((err) => {
          try {
            assert(err);
          } catch (e) {
            return done(e);
          }
          done();
        });
      });
      conn.release();
    });
  });

  it('should rollback()', function(done) {
    pool.connect((err, conn) => {
      conn.on('rollback', () => done());
      conn.rollback((err) => {
        try {
          assert(!err, err);
        } catch (e) {
          return done(e);
        }
        conn.release();
      });
    });
  });

  it('should rollback() (Promise)', function(done) {
    pool.connect().then((conn) => {
      conn.on('rollback', () => done());
      conn.rollback().then(() => conn.release());
    });
  });

  it('should rollback when returned promise rejected', function(done) {
    pool.connect((err, conn) => {
      conn.on('rollback', () => done());
      return new Promise((resolve, reject) => reject('Any error'));
    });
  });

  it('should not rollback if closed', function(done) {
    pool.connect((err, conn) => {
      assert(!err, err);
      conn.on('close', () => {
        conn.rollback((err) => {
          try {
            assert(err);
          } catch (e) {
            return done(e);
          }
          done();
        });
      });
      conn.release();
    });
  });

  it('should read client variables', function(done) {
    pool.connect((err, conn) => {
      try {
        assert(!err, err);
        assert.equal(conn.get('server_version'), '12.0');
      } catch (e) {
        return done(e);
      }
      conn.release();
      done();
    });
  });

  it('should execute(sql, params, options, callback)', function(done) {
    pool.connect((err, conn) => {
      conn.execute('select * from airports', [], {
        fetchRows: 2
      }, (err, result) => {
        try {
          assert(!err, err);
          assert(result && result.rows);
          assert.equal(result.rows.length, 2);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should execute(sql, params, callback)', function(done) {
    pool.connect((err, conn) => {
      conn.execute('select * from airports', [], (err, result) => {
        try {
          assert(!err, err);
          assert(result && result.rows);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should execute(sql, callback)', function(done) {
    pool.connect((err, conn) => {
      conn.execute('select * from airports', (err, result) => {
        try {
          assert(!err, err);
          assert(result && result.rows);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should execute(sql) (Promise)', function(done) {
    pool.connect((err, conn) => {
      conn.execute('select * from airports').then((result) => {
        try {
          assert(result && result.rows);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      }).catch((e) => done(e));
    });
  });

  it('should get error if no response got from adapter', function(done) {
    pool.connect((err, conn) => {
      conn.execute('no response', (err) => {
        try {
          assert(err);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should select() and return array rows', function(done) {
    pool.connect((err, conn) => {
      conn.select().from('airports').execute({
        fetchRows: 2
      }, (err, result) => {
        try {
          assert(!err, err);
          assert(result && result.rows);
          assert.equal(result.rows.length, 2);
          assert.equal(typeof result.rows[0], 'object');
          assert(Array.isArray(result.rows[0]));
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should select() and return object rows', function(done) {
    pool.connect((err, conn) => {
      conn.select().from('airports').execute({
        fetchRows: 2,
        objectRows: true
      }, (err, result) => {
        try {
          assert(!err, err);
          assert(result && result.rows);
          assert.equal(result.rows.length, 2);
          assert.equal(typeof result.rows[0], 'object');
          assert(!Array.isArray(result.rows[0]));
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should emit `fetch` event ', function(done) {
    pool.connect((err, conn) => {
      conn.select().from('airports')
          .on('fetch', (row) => {
            try {
              assert.equal(row.inspect(), '[object Row]');
              assert.equal(row.get('ID'), 'LFOI');
            } catch (e) {
              return done(e);
            }
            done();
          })
          .execute({
            fetchRows: 1,
            objectRows: true
          }, (err) => {
            try {
              assert(!err, err);
            } catch (e) {
              return done(e);
            }
            conn.release();
          });
    });
  });

  it('should set types that will fetched as string - fetchAsString option - 1', function(done) {
    pool.connect((err, conn) => {
      conn.select().from('airports')
          .execute({
            fetchRows: 1,
            objectRows: true,
            fetchAsString: Number
          }, (err, result) => {
            try {
              assert(!err, err);
              assert.equal(typeof result.rows[0].Flags, 'string');
            } catch (e) {
              return done(e);
            }
            conn.release();
            done();
          });
    });
  });

  it('should set types that will fetched as string - fetchAsString option - 2', function(done) {
    pool.connect((err, conn) => {
      conn.select().from('airports')
          .execute({
            fetchRows: 1,
            objectRows: true,
            fetchAsString: [Number]
          }, (err, result) => {
            try {
              assert(!err, err);
              assert.equal(typeof result.rows[0].Flags, 'string');
            } catch (e) {
              return done(e);
            }
            conn.release();
            done();
          });
    });
  });

  it('should insert()', function(done) {
    pool.connect((err, conn) => {
      conn.insert('airports', {id: 1})
          .returning({ID: 'string'})
          .execute((err, result) => {
            try {
              assert(!err, err);
              assert.equal(result.returns.ID, 1);
            } catch (e) {
              return done(e);
            }
            conn.release();
            done();
          });
    });
  });

  it('should update()', function(done) {
    pool.connect((err, conn) => {
      conn.update('airports', {id: 1})
          .execute((err) => {
            try {
              assert(!err, err);
            } catch (e) {
              return done(e);
            }
            conn.release();
            done();
          });
    });

  });

  it('should delete()', function(done) {
    pool.connect((err, conn) => {
      conn.delete('airports').execute((err) => {
        try {
          assert(!err, err);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should get sql and values in result', function(done) {
    pool.connect((err, conn) => {
      conn.select().from('airports').execute({
        fetchRows: 2,
        showSql: true
      }, (err, result) => {
        try {
          assert(!err, err);
          assert(result.sql);
          assert(result.values);
          assert(result.options);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should get sql and values in error', function(done) {
    pool.connect((err, conn) => {
      conn.execute('error', [1, 2], {showSql: true}, (err) => {
        try {
          assert(err);
          assert(err.sql);
          assert.deepEqual(err.values, [1, 2]);
          assert(err.options);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should text connection', function(done) {
    pool.connect((err, conn) => {
      conn.test((err) => {
        try {
          assert(!err);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should test connection (Promise)', function(done) {
    pool.connect((err, conn) => {
      conn.test().then(() => {
        try {
          assert(!err);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  describe('Finalize', function() {
    it('shutdown pool', (done) => pool.close(done));
  });

});