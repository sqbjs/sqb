/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');

describe('Connection', function() {

  var pool;
  before(function() {
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

  after(function() {
    pool.close(true);
  });

  it('should use reference counting for acquire/release operations', function(done) {
    pool.connect(function(err, conn) {
      try {
        assert(!err, err);
        assert(conn);
        assert(conn.isConnection);
        assert(!conn.isClosed);
        conn.on('close', function() {
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
    pool.connect(function(err, conn) {
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

  it('should commit()', function(done) {
    pool.connect(function(err, conn) {
      conn.on('commit', function() {
        done();
      });
      conn.commit(function(err) {
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
    pool.connect().then(function(conn) {
      conn.on('commit', function() {
        done();
      });
      conn.commit().then(function() {
        conn.release();
      });
    });
  });

  it('should not commit if closed', function(done) {
    pool.connect(function(err, conn) {
      conn.on('close', function() {
        conn.commit(function(err) {
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
    pool.connect(function(err, conn) {
      conn.on('rollback', function() {
        done();
      });
      conn.rollback(function(err) {
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
    pool.connect().then(function(conn) {
      conn.on('rollback', function() {
        done();
      });
      conn.rollback().then(function() {
        conn.release();
      });
    });
  });

  it('should not rollback if closed', function(done) {
    pool.connect(function(err, conn) {
      assert(!err, err);
      conn.on('close', function() {
        conn.rollback(function(err) {
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
    pool.connect(function(err, conn) {
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
    pool.connect(function(err, conn) {
      conn.execute('select * from table1', [], {
        fetchRows: 2
      }, function(err, result) {
        try {
          assert(!err, err);
          assert(result && result.rowset);
          assert.equal(result.rowset.length, 2);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should execute(sql, params, callback)', function(done) {
    pool.connect(function(err, conn) {
      conn.execute('select * from table1', [], function(err, result) {
        try {
          assert(!err, err);
          assert(result && result.rowset);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should execute(sql, callback)', function(done) {
    pool.connect(function(err, conn) {
      conn.execute('select * from table1', function(err, result) {
        try {
          assert(!err, err);
          assert(result && result.rowset);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should execute(sql) (Promise)', function(done) {
    pool.connect(function(err, conn) {
      conn.execute('select * from table1').then(function(result) {
        try {
          assert(result && result.rowset);
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      }).catch(function(e) {
        done(e);
      });
    });
  });

  it('should get error if no response got from driver', function(done) {
    pool.connect(function(err, conn) {
      conn.execute('no response', function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.select().from('table1').execute({
        fetchRows: 2
      }, function(err, result) {
        try {
          assert(!err, err);
          assert(result && result.rowset);
          assert.equal(result.rowset.length, 2);
          assert.equal(typeof result.rowset.rows[0], 'object');
          assert(Array.isArray(result.rowset.rows[0]));
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should select() and return object rows', function(done) {
    pool.connect(function(err, conn) {
      conn.select().from('table1').execute({
        fetchRows: 2,
        objectRows: true
      }, function(err, result) {
        try {
          assert(!err, err);
          assert(result && result.rowset);
          assert.equal(result.rowset.length, 2);
          assert.equal(typeof result.rowset.rows[0], 'object');
          assert(!Array.isArray(result.rowset.rows[0]));
        } catch (e) {
          return done(e);
        }
        conn.release();
        done();
      });
    });
  });

  it('should select() and call onFetchRow', function(done) {
    pool.connect(function(err, conn) {
      conn.select().from('table1')
          .onFetchRow(function(row) {
            try {
              assert.equal(row.ID, 'LFOI');
            } catch (e) {
              return done(e);
            }
            done();
          })
          .execute({
            fetchRows: 1,
            objectRows: true
          }, function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.select().from('table1')
          .execute({
            fetchRows: 1,
            objectRows: true,
            fetchAsString: Number
          }, function(err, result) {
            try {
              assert(!err, err);
              assert.equal(typeof result.rowset.rows[0].Flags, 'string');
            } catch (e) {
              return done(e);
            }
            conn.release();
            done();
          });
    });
  });

  it('should set types that will fetched as string - fetchAsString option - 2', function(done) {
    pool.connect(function(err, conn) {
      conn.select().from('table1')
          .execute({
            fetchRows: 1,
            objectRows: true,
            fetchAsString: [Number]
          }, function(err, result) {
            try {
              assert(!err, err);
              assert.equal(typeof result.rowset.rows[0].Flags, 'string');
            } catch (e) {
              return done(e);
            }
            conn.release();
            done();
          });
    });
  });

  it('should insert()', function(done) {
    pool.connect(function(err, conn) {
      conn.insert({id: 1})
          .into('table1')
          .returning({ID: 'string'})
          .execute(function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.update('table1')
          .set({id: 1})
          .execute(function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.delete('table1').execute(function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.select().from('table1').execute({
        fetchRows: 2,
        showSql: true
      }, function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.execute('error', [1, 2], {showSql: true},
          function(err, result) {
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
    pool.connect(function(err, conn) {
      conn.test(function(err) {
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
    pool.connect(function(err, conn) {
      conn.test().then(function() {
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

  it('shutdown pool', function(done) {
    pool.close(done);
  });

});