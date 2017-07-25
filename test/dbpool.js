/* eslint-disable */
const assert = require('assert');
const sqb = require('../');

describe('DbPool', function() {

  sqb.use(require('./support/test_serializer'));
  sqb.use(require('./support/test_pool'));

  let db;

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
    db.connect((err, conn) => {
      assert(!err && conn.isConnection);
      conn.close(() => done());
    });
  });

  it('should terminate pool', function(done) {
    db.close((err) => {
      assert(!err && db.isClosed);
      done();
    });
  });

  it('should test pool', function(done) {
    db.test((err) => {
      assert(!err);
      done();
    });
  });

  it('should test pool (Promise)', function(done) {
    db.test().then(() => {
      done();
    }).catch(e => {
      done(e);
    });
  });

  describe('execute query ', function() {

    it('should return array row array', function(done) {
      db.select().from().execute({
        fetchRows: 2
      }, (err, result) => {
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
          }, (err, result) => {
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
          }, (err, result) => {
            assert(!err && result && result.dataset);
            assert.equal(result.dataset.mode, 'static');
            result.dataset.next(err => {
              assert.equal(result.dataset.values.ID, 'LFOI');
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
          }, (err, result) => {
            assert(!err && result && result.dataset);
            assert.equal(result.dataset.mode, 'cursor');
            result.dataset.next(err => {
              assert.equal(result.dataset.values.ID, 'LFOI');
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
          }, (err, result) => {
            assert(!err && result && result.dataset);
            assert.equal(result.dataset.mode, 'cursor');
            result.dataset.next(err => {
              assert(result.dataset._cache);
              assert.equal(result.dataset.values.ID, 'LFOI');
              assert.equal(result.dataset.rowNum, 1);
              done();
            });
          });
    });

    it('should release connection after closing dataset', function(done) {
      db.connect((err, conn) => {
        if (err)
          return done(err);
        conn.on('close', () => done());
        conn.select()
            .from()
            .execute({
              fetchRows: 2,
              cursor: true
            }, (err, result) => {
              result.dataset.next(err => {
                result.dataset.close(() => conn.close());
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
          }, (err, result) => {
            result.dataset.connection.on('close', () => done());
            result.dataset.next(err => {
              result.dataset.close();
            });
          });
    });

  });

});