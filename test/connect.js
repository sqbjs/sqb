/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Connect', function() {

  let db;

  describe('DbPool', function() {

    it('should register dialect', function(done) {
      require('./support/test_pool');
      done();
    });

    it('should get registered DbPool', function(done) {
      assert.ok(sqb.DbPool.get('testdb'));
      done();
    });

    it('should create DbPool', function(done) {
      assert.ok(sqb.DbPool.create('testdb'));
      assert.ok(sqb.DbPool.create('generic'));
      done();
    });

    it('should create db pool', function(done) {
      db = sqb.pool({
        dialect: 'testdb',
        user: 'user',
        schema: 'schema'
      });
      assert.ok(db);
      assert.equal(db.dialect, 'testdb');
      assert.equal(db.user, 'user');
      assert.equal(db.schema, 'schema');
      done();
    });

    it('should execute query', function(done) {

      db.select('ID', 'ADI').from('ULKE').action('aaaaa').then(result => {
        assert.deepEqual(result.rows, [[1, 'a'], [2, 'b']]);
        done();
      }).catch(err => {
        done(err);
      });

    });

    it('should create connection', function(done) {

      db.connect((conn, close) => {
        done();
      }).catch(err => {
        done(err);
      });

    });

    it('should create connection', function(done) {

      db.connect((conn, close) => {
        done();
      }).catch(err => {
        done(err);
      });

    });
  });

  describe('Connection', function() {

    it('should execute sql', function(done) {

      db.connect().then(conn => {
        conn.execute('select * from test', [], {
          autoCommit: true,
          extendedMetaData: true,
          prefetchRows: 1,
          resultSet: false,
          objectRows: false,
          debug: false
        }).then(result => {
          assert.deepEqual(result.rows, [[1, 'a'], [2, 'b']]);
          conn.close();
          done();
        }).catch(err => {
          conn.close();
          done(err);
        });

      }).catch(err => {
        close();
        done(err);
      });

    });

    it('should execute select query', function(done) {

      db.connect().then(conn => {
        conn.select().then(result => {
          done();
        }).catch(err => {
          conn.close();
          done(err);
        });

      }).catch(err => {
        close();
        done(err);
      });

    });

    it('should execute insert query', function(done) {

      db.connect().then(conn => {

        return conn.insert('a').into('table1').values({a: 1})
            .then(result => {
              done();
            });

      }).catch(err => {
        done(err);
      });

    });

    it('should execute update query', function(done) {

      db.connect().then(conn => {
        return conn.update('table2').set({a: 1}).then(result => {
          done();
        });

      }).catch(err => {
        done(err);
      });

    });

    it('should execute delete query', function(done) {

      db.connect().then(conn => {
        return conn.delete('table1').then(result => {
          done();
        });

      }).catch(err => {
        done(err);
      });

    });

  });

});