/* eslint-disable */
const assert = require('assert');
const sqb = require('../');

describe('DbPool', function() {

  sqb.use(require('./support/test_serializer'));
  sqb.use(require('./support/test_connection'));

  var pool;

  it('should create a pool for test dialect', function(done) {
    pool = sqb.pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      pool: {
        validate: true
      }
    });
    assert.ok(pool);
    assert.equal(pool.dialect, 'test');
    assert.equal(pool.user, 'user');
    assert.equal(pool.schema, 'schema');
    done();
  });

  it('should create connection', function(done) {
    pool.connect(function(err, conn) {
      assert(!err && conn.isConnection);
      conn.close();
      done();
    });
  });

  it('should test pool', function(done) {
    pool.test(function(err) {
      assert(!err, err);
      done();
    });
  });

  it('should test pool (Promise)', function(done) {
    pool.test().then(done).catch(done);
  });

  it('should execute and return array rows', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2
    }, function(err, result) {
      assert(!err, err);
      assert(result && result.rows);
      assert.equal(result.rows.length, 2);
      assert(Array.isArray(result.rows[0]));
      assert(result.rows[0][0] === 'LFOI');
      done();
    });
  });

  it('should execute and return object rows', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2,
      objectRows: true
    }, function(err, result) {
      assert(!err, err);
      assert(result && result.rows);
      assert.equal(result.rows.length, 2);
      assert(!Array.isArray(result.rows[0]));
      assert(result.rows[0].ID === 'LFOI');
      done();
    });
  });

  it('should execute and return static dataset', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2,
      objectRows: true,
      datasetMode: sqb.DatasetMode.STATIC
    }, function(err, result) {
      assert(!err, err);
      assert(result && result.dataset);
      assert.equal(result.dataset.mode, 'static');
      result.dataset.next(function(err) {
        assert.equal(result.dataset.getValue('ID'), 'LFOI');
        done();
      });
    });
  });

  it('should execute and return cursor dataset', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2,
      objectRows: true,
      datasetMode: sqb.DatasetMode.CURSOR
    }, function(err, result) {
      assert(!err, err);
      assert(result && result.dataset);
      assert.equal(result.dataset.mode, 'cursor');
      result.dataset.next(function(err) {
        assert.equal(result.dataset.getValue('ID'), 'LFOI');
        assert.equal(result.dataset.rowNum, 1);
        result.dataset.close();
        done();
      });
    });
  });

  it('should execute and return cached dataset', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2,
      objectRows: true,
      datasetMode: sqb.DatasetMode.CACHED
    }, function(err, result) {
      assert(!err && result && result.dataset);
      assert.equal(result.dataset.mode, 'cursor');
      result.dataset.next(function(err) {
        assert(!err, err);
        assert(result.dataset._cache);
        assert.equal(result.dataset.getValue('ID'), 'LFOI');
        assert.equal(result.dataset.rowNum, 1);
        result.dataset.close();
        done();
      });
    });
  });

  it('should execute and release connection after closing dataset-1', function(done) {
    pool.connect(function(err, conn) {
      if (err)
        return done(err);
      conn.on('close', done);
      conn.select().from('table1').execute({
        fetchRows: 2,
        datasetMode: sqb.DatasetMode.CURSOR
      }, function(err, result) {
        assert(!err, err);
        result.dataset.next(function(err) {
          assert(!err, err);
          result.dataset.close(function(err) {
            assert(!err, err);
            conn.close();
          });
        });
      });
    });
  });

  it('should execute and release connection after closing dataset-2', function(done) {
    pool.select().from('table1').execute({
      fetchRows: 2,
      objectRows: true,
      datasetMode: sqb.DatasetMode.CURSOR
    }, function(err, result) {
      assert(!err, err);
      result.dataset.connection.on('close', done);
      result.dataset.next(function(err) {
        assert(!err, err);
        result.dataset.close();
      });
    });
  });

  it('should terminate pool', function(done) {
    pool.close(function(err) {
      assert(!err, err);
      assert(pool.isClosed);
      done();
    });
  });

});