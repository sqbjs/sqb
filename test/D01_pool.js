/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');

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
    pool.once('create', () => {
      assert.equal(pool.size, 1);
      assert.equal(pool.available, 1);
      done();
    });
    pool.start();
  });

  it('should create/release connection', function(done) {
    pool.acquire().then(conn => {
      assert.equal(pool.size, 1);
      assert.equal(pool.available, 0);
      assert.equal(pool.pending, 0);
      assert.equal(pool.acquired, 1);
      assert(typeof conn.metaData, 'object');

      conn.once('close', () => {
        try {
          assert.equal(pool.size, 1);
          assert.equal(pool.available, 1);
          assert.equal(pool.pending, 0);
          assert.equal(pool.acquired, 0);
          done();
        } catch (e) {
          done(e);
        }
      });
      conn.release();
    }).catch(e => done(e));
  });

  it('should validate connection', function() {
    return pool.acquire().then(conn => {
      assert(conn.release());
      return pool.acquire().then(conn => {
        assert(!conn._client._tested);
        assert(conn.release());
      });
    });
  });

  it('should get error when adapter create fails', function(done) {
    const pool2 = new sqb.Pool({
      dialect: 'test',
      pool: {
        max: 1,
        acquireTimeoutMillis: 1
      }
    });
    pool2.acquire().then(conn => {
      pool2.acquire().then(() => done('Failed')).catch(() => {
        done();
        pool2.close(true);
      });
    });
  });

  it('should test pool', function() {
    return pool.test();
  });

  it('should test() handle errors', function() {
    pool.acquire = () => Promise.reject(new Error('Any error'));
    return pool.test()
        .then(() => assert(0, 'Failed'))
        .catch(err => {
          delete pool.acquire;
        });
  });

  it('should execute() select query', function() {
    return pool.execute('select * from airports', {
      objectRows: false,
      values: []
    }).then(result => {
      assert(result && result.rows);
      assert(Array.isArray(result.rows[0]));
      assert(result.rows[0][0] === 'LFOI');
    });
  });

  it('should execute() select query - 2 args', function() {
    return pool.execute('select * from airports').then(result => {
      assert(result && result.rows);
      assert(!Array.isArray(result.rows[0]));
      assert(result.rows[0].ID === 'LFOI');
    });
  });

  it('should execute() limit fetchRows', function() {
    return pool.execute('select * from airports', {
      objectRows: false,
      fetchRows: 2
    }).then(result => {
      assert(result && result.rows);
      assert.equal(result.rows.length, 2);
      assert(Array.isArray(result.rows[0]));
      assert(result.rows[0][0] === 'LFOI');
    });
  });

  it('should select() and return array rows', function() {
    return pool.select().from('airports').execute({
      objectRows: false,
      fetchRows: 2
    }).then(result => {
      assert(result && result.rows);
      assert.equal(result.rows.length, 2);
      assert(Array.isArray(result.rows[0]));
      assert(result.rows[0][0] === 'LFOI');
    });
  });

  it('should select() and return object rows', function() {
    return pool.select().from('airports').execute({
      fetchRows: 2
    }).then(result => {
      assert(result && result.rows);
      assert.equal(result.rows.length, 2);
      assert(!Array.isArray(result.rows[0]));
      assert(result.rows[0].ID === 'LFOI');
    });
  });

  it('should insert()', function() {
    return pool.insert('airports', {id: 1}).execute();
  });

  it('should update()', function() {
    return pool.update('airports', {id: 1}).execute();
  });

  it('should delete()', function() {
    return pool.delete('airports').execute();
  });

  it('should set defaults.objectRows option', function() {
    pool.config.defaults.objectRows = false;
    return pool.execute('select * from airports').then(result => {
      assert(Array.isArray(result.rows[0]));
      pool.config.defaults.objectRows = null;
      return pool.execute('select * from airports').then(result => {
        assert(!Array.isArray(result.rows[0]));
        pool.config.defaults.showSql = null;
      });
    });
  });

  it('should set defaults.naming option', function() {
    pool.config.defaults.naming = 'lowercase';
    return pool.execute('select * from airports').then(result => {
      assert(result && result.rows);
      assert(!Array.isArray(result.rows[0]));
      assert(result.rows[0].id === 'LFOI');
      pool.config.defaults.naming = null;
      return pool.execute('select * from airports').then(result => {
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].ID === 'LFOI');
      });
    });
  });

  it('should set defaults.showSql option', function() {
    pool.config.defaults.showSql = true;
    return pool.execute('select * from airports').then(result => {
      assert(result.query.sql);
      pool.config.defaults.showSql = null;
    });
  });

  it('should set defaults.autoCommit option', function() {
    pool.config.defaults.showSql = true;
    pool.config.defaults.autoCommit = true;
    return pool.execute('select * from airports').then(result => {
      assert.equal(result.options.autoCommit, true);
      pool.config.defaults.showSql = null;
    });
  });
  it('should set defaults.fields option', function() {
    pool.config.defaults.fields = true;
    return pool.execute('select * from airports').then(result => {
      assert(result.fields);
      pool.config.defaults.fields = null;
    });
  });

  it('should set defaults.ignoreNulls option', function() {
    pool.config.defaults.ignoreNulls = true;
    return pool.execute('select * from airports').then(result => {
      assert.equal(result.rows[0].Catalog, undefined);
      pool.config.defaults.ignoreNulls = null;
      return pool.execute('select * from airports').then(result => {
        assert.equal(result.rows[0].Catalog, null);
      });
    });
  });

  it('shutdown pool', function() {
    return pool.close().then(() => {
      if (!pool.isClosed)
        throw new Error('Failed');
    });
  });

});
