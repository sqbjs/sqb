/* eslint-disable */
const assert = require('assert');
const sqb = require('../');
const testDriver = require('./support/test_driver');
const plugins = require('../lib/plugins');

describe('Pool', function() {

  var pool;

  after(function() {
    pool.close(true);
  });

  it('should drivers can be registered as plugins', function() {
    assert(plugins.items);
    assert.equal(plugins.items.length, 1);
    assert.equal(plugins.stringify, undefined);
    sqb.use(require('./support/test_serializer'));
    sqb.use(testDriver);
    assert.equal(plugins.items.length, 2);
    assert(plugins.stringify);
  });

  it('should not create a pool with unknown dialect', function() {
    try {
      pool = sqb.createPool({
        dialect: 'test2',
        user: 'user',
        schema: 'schema'
      });
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should create a pool for test dialect', function() {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      pool: {
        validate: true,
        min: 1
      }
    });
    assert.ok(pool);
    assert.equal(pool.dialect, 'test');
    assert.equal(pool.user, 'user');
    assert.equal(pool.schema, 'schema');
    assert(pool.metaData);
    assert(typeof pool.metaData, 'object');
    assert.equal(pool.state, pool.PoolState.IDLE);
  });

  it('should create a pool with default options', function() {
    const pool2 = new sqb.Pool({
      dialect: 'test',
      user: 'user'
    });
    assert.ok(pool2);
    assert.equal(pool2.options.acquireMaxRetries, 0);
    assert.equal(pool2.options.acquireRetryWait, 2000);
    assert.equal(pool2.options.acquireTimeoutMillis, 0);
    assert.equal(pool2.options.idleTimeoutMillis, 30000);
    assert.equal(pool2.options.max, 10);
    assert.equal(pool2.options.min, 0);
    assert.equal(pool2.options.minIdle, 0);
    assert.equal(pool2.options.maxQueue, 1000);
    assert.equal(pool2.options.validation, true);
  });

  it('should start pool', function(done) {
    pool.start();
    setTimeout(function() {
      assert.equal(pool.size, 1);
      assert.equal(pool.available, 1);
      done();
    }, 10);
  });

  it('should create connection', function(done) {
    pool.connect(function(err, conn) {
      try {
        assert(!err && conn.isConnection);
        assert.equal(pool.size, 1);
        assert.equal(pool.available, 0);
        assert.equal(pool.pending, 0);
        assert.equal(pool.acquired, 1);
        assert(conn.metaData);
        assert(typeof conn.metaData, 'object');
      } catch (e) {
        return done(e);
      }
      conn.on('close', function() {
        try {
          assert.equal(pool.size, 1);
          assert.equal(pool.available, 1);
          assert.equal(pool.pending, 0);
          assert.equal(pool.acquired, 0);
        } catch (e) {
          return done(e);
        }
        done();
      });
      conn.release();
    });
  });

  it('should close connection when throw error in callback', function(done) {
    pool.connect(function(err, conn) {
      conn.on('close', function() {
        done();
      });
      throw 'test';
    });
  });

  it('should get error on driver create error', function(done) {
    const pool2 = new sqb.Pool({
      dialect: 'test',
      pool: {
        max: 1,
        acquireTimeoutMillis: 1
      }
    });

    pool2.connect(function(err, conn) {
      try {
        assert(!err, err);
        assert(conn);
      } catch (e) {
        return done(e);
      }
      pool2.connect(function(err, conn) {
        try {
          assert(err);
          assert(!conn);
        } catch (e) {
          return done(e);
        }
        pool2.close(true, done);
      });
    });
  });

  it('should create connection (Promise)', function(done) {
    pool.connect().then(function(conn) {
      try {
        assert.equal(pool.size, 1);
        assert.equal(pool.available, 0);
        assert.equal(pool.pending, 0);
        assert.equal(pool.acquired, 1);
      } catch (e) {
        return done(e);
      }
      conn.on('close', function() {
        try {
          assert.equal(pool.size, 1);
          assert.equal(pool.available, 1);
          assert.equal(pool.pending, 0);
          assert.equal(pool.acquired, 0);
        } catch (e) {
          return done(e);
        }
        done();
      });
      conn.release();
    });
  });

  it('should test pool', function(done) {
    pool.test(function(err) {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should test() handle errors', function(done) {
    pool.connect = function(cb) {
      cb(new Error('Any error'));
    };
    pool.test(function(err) {
      delete pool.connect;
      try {
        assert(err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should test pool (Promise)', function() {
    return pool.test().then();
  });

  it('should execute() select query - 3 args', function(done) {
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
        assert(Array.isArray(result.rowset.rows[0]));
        assert(result.rowset.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should execute() select query - 2 args', function(done) {
    pool.execute('select * from table1', function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
        assert(Array.isArray(result.rowset.rows[0]));
        assert(result.rowset.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should execute() limit fetchRows', function(done) {
    pool.execute('select * from table1', [], {
      fetchRows: 2
    }, function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
        assert.equal(result.rowset.length, 2);
        assert(Array.isArray(result.rowset.rows[0]));
        assert(result.rowset.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should select() and return array rows', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2
    }, function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
        assert.equal(result.rowset.length, 2);
        assert(Array.isArray(result.rowset.rows[0]));
        assert(result.rowset.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should select() and return object rows', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2,
      objectRows: true
    }, function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
        assert.equal(result.rowset.length, 2);
        assert(!Array.isArray(result.rowset.rows[0]));
        assert(result.rowset.rows[0].ID === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should insert()', function(done) {
    pool.insert({id: 1}).into('table1').execute(function(err, result) {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should update()', function(done) {
    pool.update('table1').set({id: 1}).execute(function(err, result) {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should delete()', function(done) {
    pool.delete('table1').execute(function(err, result) {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should terminate pool', function(done) {
    pool.close(function(err) {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should set defaults.objectRows option', function() {
    pool.defaults.objectRows = true;
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert(typeof result.rowset.rows[0] === 'object' &&
            !Array.isArray(result.rowset.rows[0]));
      } catch (e) {
        return done(e);
      }
      pool.defaults.objectRows = null;
      pool.execute('select * from table1', [], function(err, result) {
        try {
          assert(!err, err);
          assert(Array.isArray(result.rowset.rows[0]));
        } catch (e) {
          return done(e);
        }
        pool.defaults.showSql = null;
        done();
      });
    });
  });

  it('should set defaults.naming option', function() {
    pool.defaults.objectRows = true;
    pool.defaults.naming = 'lowercase';
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
        assert(Array.isArray(result.rowset.rows[0]));
        assert(result.rowset.rows[0].id === 'LFOI');
      } catch (e) {
        return done(e);
      }
      pool.defaults.naming = null;
      pool.execute('select * from table1', [], function(err, result) {
        try {
          assert(!err, err);
          assert(result && result.rowset);
          assert(Array.isArray(result.rowset.rows[0]));
          assert(result.rowset.rows[0].ID === 'LFOI');
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('should set defaults.showSql option', function() {
    pool.defaults.showSql = true;
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert(result.sql);
      } catch (e) {
        return done(e);
      }
      pool.defaults.showSql = null;
      done();
    });
  });

  it('should set defaults.autoCommit option', function() {
    pool.defaults.showSql = true;
    pool.defaults.autoCommit = true;
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert.equal(result.options.autoCommit, true);
      } catch (e) {
        return done(e);
      }
      pool.defaults.showSql = null;
      done();
    });
  });
  it('should set defaults.fields option', function() {
    pool.defaults.fields = true;
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert(result.fields);
      } catch (e) {
        return done(e);
      }
      pool.defaults.fields = null;
      done();
    });
  });

  it('should set defaults.ignoreNulls option', function() {
    pool.defaults.objectRows = true;
    pool.defaults.ignoreNulls = true;
    pool.execute('select * from table1', [], function(err, result) {
      try {
        assert(!err, err);
        assert.equal(result.rows[0].Catalog, undefined);
      } catch (e) {
        return done(e);
      }
      pool.defaults.ignoreNulls = null;
      pool.execute('select * from table1', [], function(err, result) {
        try {
          assert(!err, err);
          assert.equal(result.rows[0].Catalog, null);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('shutdown pool', function(done) {
    pool.close(function() {
      if (!pool.isClosed)
        return done(new Error('Failed'));
      done();
    });
  });

});