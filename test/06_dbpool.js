/* eslint-disable */
const assert = require('assert');
const sqb = require('../');

describe('DbPool', function() {

  sqb.use(require('./support/test_serializer'));
  sqb.use(require('./support/test_pool'));

  var db;

  it('should create a pool for test dialect', function(done) {
    db = sqb.pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema'
    });
    assert.ok(db);
    assert.equal(db.dialect, 'test');
    assert.equal(db.user, 'user');
    assert.equal(db.schema, 'schema');
    done();
  });

  it('should create connection', function(done) {
    db.connect(function(err, conn) {
      assert(!err && conn.isConnection);
      conn.close(done);
    });
  });

  it('should terminate pool', function(done) {
    db.close(function(err) {
      assert(!err && db.isClosed);
      done();
    });
  });

  it('should test pool', function(done) {
    db.test(function(err) {
      assert(!err);
      done();
    });
  });

  it('should test pool (Promise)', function(done) {
    db.test().then(done).catch(done);
  });

  describe('execute query ', function() {

    it('should return array row array', function(done) {
      db.select().from().execute({
        fetchRows: 2
      }, function(err, result) {
        assert(!err && result && result.rows &&
            result.rows.length === 2 &&
            Array.isArray(result.rows[0]) &&
            result.rows[0][0] === 'LFOI');
        done();
      });
    });

    it('should return object row array', function(done) {
      db.select()
          .from()
          .execute({
            fetchRows: 2,
            objectRows: true
          }, function(err, result) {
            assert(!err && result && result.rows &&
                result.rows.length === 2 &&
                !Array.isArray(result.rows[0]) &&
                result.rows[0].ID === 'LFOI');
            done();
          });
    });

    it('should return static dataset', function(done) {
      db.select()
          .from()
          .execute({
            fetchRows: 2,
            objectRows: true,
            dataset: true
          }, function(err, result) {
            assert(!err && result && result.dataset);
            assert.equal(result.dataset.mode, 'static');
            result.dataset.next(function(err) {
              assert.equal(result.dataset.getValue('ID'), 'LFOI');
              done();
            });
          });
    });

    it('should return cursor dataset', function(done) {
      db.select()
          .from()
          .execute({
            fetchRows: 2,
            objectRows: true,
            cursor: true
          }, function(err, result) {
            assert(!err && result && result.dataset);
            assert.equal(result.dataset.mode, 'cursor');
            result.dataset.next(function(err) {
              assert.equal(result.dataset.getValue('ID'), 'LFOI');
              assert.equal(result.dataset.rowNum, 1);
              done();
            });
          });
    });

    it('should return cached dataset', function(done) {
      db.select()
          .from()
          .execute({
            fetchRows: 2,
            objectRows: true,
            dataset: true,
            caching: true
          }, function(err, result) {
            assert(!err && result && result.dataset);
            assert.equal(result.dataset.mode, 'cursor');
            result.dataset.next(function(err) {
              assert(result.dataset._cache);
              assert.equal(result.dataset.getValue('ID'), 'LFOI');
              assert.equal(result.dataset.rowNum, 1);
              done();
            });
          });
    });

    it('should release connection after closing dataset', function(done) {
      db.connect(function(err, conn) {
        if (err)
          return done(err);
        conn.on('close', done);
        conn.select()
            .from()
            .execute({
              fetchRows: 2,
              cursor: true
            }, function(err, result) {
              result.dataset.next(function(err) {
                result.dataset.close(function() {
                  conn.close();
                });
              });
            });
      });
    });

    it('should release connection after closing dataset', function(done) {
      db.select()
          .from()
          .execute({
            fetchRows: 2,
            objectRows: true,
            cursor: true
          }, function(err, result) {
            result.dataset.connection.on('close', done);
            result.dataset.next(function(err) {
              result.dataset.close();
            });
          });
    });

  });

});