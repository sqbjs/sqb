/* eslint-disable */
const assert = require('assert');
const sqb = require('../');

describe('Pool', function() {

  let pool;

  after(() => pool.close(true));

  it('should not create a pool with unknown dialect', function() {
    try {
      pool = sqb.pool({
        dialect: 'test2',
        user: 'user',
        schema: 'schema'
      });
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should verify config argument', function() {
    try {
      sqb.pool();
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
    assert.equal(pool.config.user, 'user');
    assert.equal(pool.config.schema, 'schema');
    assert.equal(pool.state, sqb.PoolState.IDLE);
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
    assert(pool2.options.validation);
  });

  it('should toString/inspect returns formatted string', function() {
    assert.equal(pool.inspect(), '[object Pool(test)]');
  });

  it('should start pool', function(done) {
    pool.on('create', () => {
      assert.equal(pool.size, 1);
      assert.equal(pool.available, 1);
      done();
    });
    pool.start();
  });

  it('should create connection', function(done) {
    pool.connect((err, conn) => {
      try {
        assert(!err && conn);
        assert.equal(pool.size, 1);
        assert.equal(pool.available, 0);
        assert.equal(pool.pending, 0);
        assert.equal(pool.acquired, 1);
        assert(typeof conn.metaData, 'object');
      } catch (e) {
        return done(e);
      }
      conn.on('close', () => {
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

  it('should validate connection', function(done) {
    pool.connect((err, conn) => {
      conn.on('close', function() {
        pool.connect(function(err, conn) {
          conn.on('close', function() {
            done();
          });
          if (conn._client._tested)
            conn.release();
          else done(new Error('Failed'));
        });
      });
      conn.release();
    });
  });

  it('should close connection when throw error in callback', function(done) {
    pool.connect((err, conn) => {
      conn.on('close', function() {
        done();
      });
      throw 'test';
    });
  });

  it('should get error on adapter create error', function(done) {
    const pool2 = new sqb.Pool({
      dialect: 'test',
      pool: {
        max: 1,
        acquireTimeoutMillis: 1
      }
    });

    pool2.connect((err, conn) => {
      try {
        assert(!err, err);
        assert(conn);
      } catch (e) {
        return done(e);
      }
      pool2.connect((err, conn) => {
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
    pool.connect().then((conn) => {
      try {
        assert.equal(pool.size, 1);
        assert.equal(pool.available, 0);
        assert.equal(pool.pending, 0);
        assert.equal(pool.acquired, 1);
      } catch (e) {
        return done(e);
      }
      conn.on('close', () => {
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
    pool.test((err) => {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should test() handle errors', function(done) {
    pool.connect = (cb) => cb(new Error('Any error'));

    pool.test((err) => {
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
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should execute() select query - 2 args', function(done) {
    pool.execute('select * from airports', (err, result) => {
      try {
        assert(!err, err);
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should execute() limit fetchRows', function(done) {
    pool.execute('select * from airports', [], {
      fetchRows: 2
    }, (err, result) => {
      try {
        assert(!err, err);
        assert(result && result.rows);
        assert.equal(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should execute() (Promise)', function(done) {
    pool.execute('select * from airports', []).then((result) => {
      assert(result && result.rows);
      assert(Array.isArray(result.rows[0]));
      assert(result.rows[0][0] === 'LFOI');
      done();
    }).catch((reason) => {
      done(reason);
    });
  });

  it('should select() and return array rows', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 2
    }, (err, result) => {
      try {
        assert(!err, err);
        assert(result && result.rows);
        assert.equal(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should select() and return object rows', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 2,
      objectRows: true
    }, (err, result) => {
      try {
        assert(!err, err);
        assert(result && result.rows);
        assert.equal(result.rows.length, 2);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].ID === 'LFOI');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should insert()', function(done) {
    pool.insert('airports', {id: 1}).execute((err) => {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should update()', function(done) {
    pool.update('airports', {id: 1}).execute((err) => {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should delete()', function(done) {
    pool.delete('airports').execute((err) => {
      try {
        assert(!err, err);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should set defaults.objectRows option', function(done) {
    pool.config.defaults.objectRows = true;
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert(typeof result.rows[0] === 'object' &&
            !Array.isArray(result.rows[0]));
      } catch (e) {
        return done(e);
      }
      pool.config.defaults.objectRows = null;
      pool.execute('select * from airports', [], (err, result) => {
        try {
          assert(!err, err);
          assert(Array.isArray(result.rows[0]));
        } catch (e) {
          return done(e);
        }
        pool.config.defaults.showSql = null;
        done();
      });
    });
  });

  it('should set defaults.naming option', function(done) {
    pool.config.defaults.objectRows = true;
    pool.config.defaults.naming = 'lowercase';
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].id === 'LFOI');
      } catch (e) {
        return done(e);
      }
      pool.config.defaults.naming = null;
      pool.execute('select * from airports', [], (err, result) => {
        try {
          assert(!err, err);
          assert(result && result.rows);
          assert(!Array.isArray(result.rows[0]));
          assert(result.rows[0].ID === 'LFOI');
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('should set defaults.showSql option', function(done) {
    pool.config.defaults.showSql = true;
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert(result.sql);
      } catch (e) {
        return done(e);
      }
      pool.config.defaults.showSql = null;
      done();
    });
  });

  it('should set defaults.autoCommit option', function(done) {
    pool.config.defaults.showSql = true;
    pool.config.defaults.autoCommit = true;
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert.equal(result.options.autoCommit, true);
      } catch (e) {
        return done(e);
      }
      pool.config.defaults.showSql = null;
      done();
    });
  });
  it('should set defaults.fields option', function(done) {
    pool.config.defaults.fields = true;
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert(result.fields);
      } catch (e) {
        return done(e);
      }
      pool.config.defaults.fields = null;
      done();
    });
  });

  it('should set defaults.ignoreNulls option', function(done) {
    pool.config.defaults.objectRows = true;
    pool.config.defaults.ignoreNulls = true;
    pool.execute('select * from airports', [], (err, result) => {
      try {
        assert(!err, err);
        assert.equal(result.rows[0].Catalog, undefined);
      } catch (e) {
        return done(e);
      }
      pool.config.defaults.ignoreNulls = null;
      pool.execute('select * from airports', [], (err, result) => {
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
    pool.close(() => {
      if (!pool.isClosed)
        return done(new Error('Failed'));
      done();
    });
  });

});