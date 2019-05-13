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

  it('should toString/inspect returns formatted string', function() {
    return pool.acquire().then(conn => {
      assert(conn.inspect().match(/\[object Connection\(\d\)]/));
      conn.release();
    });
  });

  it('should use reference counting for acquire/release operations', function(done) {
    pool.acquire().then(conn => {
      conn.on('close', () => {
        try {
          assert.strictEqual(conn.referenceCount, 0);
        } catch (e) {
          return done(e);
        }
        done();
      });
      try {
        assert(!conn.isClosed);
        assert.strictEqual(conn.referenceCount, 1);
        conn.acquire();
        assert.strictEqual(conn.referenceCount, 2);
        conn.release();
        assert.strictEqual(conn.referenceCount, 1);
        conn.release();
      } catch (e) {
        return done(e);
      }
    });
  });

  it('should not release() more than acquired', function() {
    return pool.acquire().then(conn => {
      assert(conn);
      conn.release();
      try {
        conn.release();
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });
  });

  it('should startTransaction()', function() {
    return pool.acquire().then(conn => {
      return conn.startTransaction().then(() => conn.release());
    });
  });

  it('should not start transaction if closed', function(done) {
    pool.acquire().then(conn => {
      conn.on('close', () => {
        conn.startTransaction()
            .then(() => done('Failed'))
            .catch(() => done());
      });
      conn.release();
    });
  });

  it('should commit()', function() {
    return pool.acquire().then(conn => {
      return conn.commit().then(() => conn.release());
    });
  });

  it('should not commit if closed', function(done) {
    pool.acquire().then(conn => {
      conn.on('close', () => {
        conn.commit()
            .then(() => done('Failed'))
            .catch(() => done());
      });
      conn.release();
    });
  });

  it('should rollback()', function() {
    return pool.acquire().then(conn => {
      return conn.rollback().then(() => conn.release());
    });
  });

  it('should not rollback if closed', function(done) {
    pool.acquire().then(conn => {
      conn.on('close', () => {
        conn.rollback()
            .then(() => done('Failed'))
            .catch(() => done());
      });
      conn.release();
    });
  });

  it('should read client variables', function() {
    return pool.acquire().then(conn => {
      assert.strictEqual(conn.get('server_version'), '12.0');
      return conn.release();
    });
  });

  it('should execute(sql, options)', function() {
    return pool.acquire().then(conn => {
      return conn.execute('select * from airports', {
        fetchRows: 2
      }).then(result => {
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        return conn.release();
      });
    });
  });

  it('should execute(sql)', function() {
    return pool.acquire().then(conn => {
      return conn.execute('select * from airports').then(result => {
        assert(result && result.rows);
        return conn.release();
      });
    });
  });

  it('should get error if no response got from adapter', function(done) {
    pool.acquire().then(conn => {
      conn.execute('no response')
          .then(() => done('Failed'))
          .catch(() => {
            conn.release();
            done();
          });
    });
  });

  it('should select() and return array rows', function() {
    return pool.acquire().then(conn => {
      return conn.select().from('airports').execute({
        fetchRows: 2,
        objectRows: false
      }).then(result => {
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert.strictEqual(typeof result.rows[0], 'object');
        assert(Array.isArray(result.rows[0]));
        return conn.release();
      });
    });
  });

  it('should select() and return object rows', function() {
    return pool.acquire().then(conn => {
      return conn.select().from('airports').execute({
        fetchRows: 2,
        objectRows: true
      }).then(result => {
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert.strictEqual(typeof result.rows[0], 'object');
        assert(!Array.isArray(result.rows[0]));
        return conn.release();
      });
    });
  });

  it('should emit `fetch` event ', function() {
    let ok;
    return pool.select().from('airports')
        .on('fetch', (row) => {
          assert.strictEqual(row.ID, 'LFOI');
          ok = 1;
        })
        .execute({
          fetchRows: 1,
          objectRows: true
        }).then(() => {
          assert(ok, 'Failed');
        });
  });

  it('should set types that will fetched as string - fetchAsString option - 1', function() {
    return pool.select().from('airports')
        .execute({
          fetchRows: 1,
          objectRows: true,
          fetchAsString: Number
        }).then(result => {
          assert.strictEqual(typeof result.rows[0].Flags, 'string');
        });
  });

  it('should set types that will fetched as string - fetchAsString option - 2', function() {
    return pool.select().from('airports')
        .execute({
          fetchRows: 1,
          objectRows: true,
          fetchAsString: [Number]
        }).then(result => {
          assert.strictEqual(typeof result.rows[0].Flags, 'string');
        });
  });

  it('should insert()', function() {
    return pool.insert('airports', {id: 1})
        .returning({ID: 'string'})
        .execute({}).then(result => {
          assert.strictEqual(result.returns.ID, 1);
        });
  });

  it('should update()', function() {
    return pool.update('airports', {id: 1})
        .execute();
  });

  it('should delete()', function() {
    return pool.delete('airports')
        .execute();
  });

  it('should get sql and values in result', function() {
    return pool.select().from('airports').execute({
      fetchRows: 2,
      showSql: true
    }).then(result => {
      assert(result.query.sql);
      assert(result.query.values);
      assert(result.options);
    });
  });

  it('should get sql and values in error', function() {
    return pool.execute('error', {values: [1, 2], showSql: true})
        .catch(err => {
          assert(err.query.sql);
          assert.deepStrictEqual(err.query.values, [1, 2]);
          assert(err.options.showSql);
        });
  });

  it('should test connection', function() {
    return pool.acquire(conn => conn.test());
  });

  it('should emit `execute` event', function() {
    let i = 0;
    const fn = () => {
      i++;
    };
    return pool.acquire(conn => {
      conn.once('execute', fn);
      return conn.execute('select * from airports');
    }).then(() => {
      assert.strictEqual(i, 1);
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
