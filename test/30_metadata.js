/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');

describe('Metadata', function() {

  var pool;
  before(function() {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema'
    });
  });

  after(function() {
    pool.close(true);
  });

  it('should throw error if driver does not support metaData', function() {
    const old = pool._driver.metaData;
    try {
      pool._driver.metaData = null;
      pool.metaData.query();
    } catch (e) {
      pool._driver.metaData = old;
      return;
    }
    assert(0, 'Failed');
  });

  it('should call query(callback)', function(done) {
    pool.metaData.query(done);
  });

  it('should call query({}, callback)', function(done) {
    pool.metaData.query({}, done);
  });

  describe('For dialects that supports schemas', function() {
    it('should query all schemas with "*"', function(done) {
      pool._driver.supportsSchemas = true;
      pool.metaData.query({schemas: '*'}, function(err, result) {
        assert.deepEqual(result, {schemas: '*'});
        done();
      });
    });

    it('should query some schema', function(done) {
      pool._driver.supportsSchemas = true;
      pool.metaData.query({
        schemas: {
          test1: '*'
        }
      }, function(err, result) {
        assert.deepEqual(result, {
          schemas: {
            test1: '*'
          }
        });
        done();
      });
    });

    it('should query some tables', function(done) {
      pool._driver.supportsSchemas = true;
      pool.metaData.query({
        schemas: {
          test1: {
            tables: ['table1', 'table2']
          }
        }
      }, function(err, result) {
        assert.deepEqual(result, {
          schemas: {
            test1: {
              tables: ['table1', 'table2']
            }
          }
        });
        done();
      });
    });

  });

  describe('For dialects that does not supports schemas', function() {
    it('should call query({schemas: "*"}, callback) - (not supports schemas)', function(done) {
      pool._driver.supportsSchemas = false;
      pool.metaData.query({schemas: '*'}, function(err, result) {
        assert(err);
        pool.metaData.query({tables: '*'}, function(err, result) {
          assert.deepEqual(result, {tables: '*'});
          done();
        });
      });
    });

    it('should query some tables', function(done) {
      pool._driver.supportsSchemas = false;
      pool.metaData.query({
        tables: ['table1', 'table2']
      }, function(err, result) {
        assert.deepEqual(result, {
          tables: ['table1', 'table2']
        });
        done();
      });
    });
  });

  describe('Finalize', function() {
    it('shutdown pool', function(done) {
      pool.close(done);
    });
  });

});