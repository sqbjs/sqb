/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');

describe('Metadata-Select', function() {

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
    const old = pool._driver.metaOperator;
    try {
      pool._driver.metaOperator = null;
      pool.metaData;
    } catch (e) {
      pool._driver.metaOperator = old;
      return;
    }
    assert(0, 'Failed');
  });

  it('should throw error if driver does not support metaData.select', function() {
    const old = pool._driver.metaOperator.getSelectSql;
    try {
      pool._driver.metaOperator.getSelectSql = null;
      pool.metaData.select();
    } catch (e) {
      pool._driver.metaOperator.getSelectSql = old;
      return;
    }
    assert(0, 'Failed');
  });

  it('should select schemas', function() {
    const query = pool.metaData.select('name').from('schemas');
    var result = query.generate();
    assert.equal(result.sql, 'select name from (schemas)');
  });

  it('should select tables', function() {
    const query = pool.metaData.select().from('tables');
    var result = query.generate();
    assert.equal(result.sql, 'select * from (tables)');
  });

  it('should select columns', function() {
    const query = pool.metaData.select().from('columns');
    var result = query.generate();
    assert.equal(result.sql, 'select * from (columns)');
  });

  it('should select primary_keys', function() {
    const query = pool.metaData.select().from('primary_keys');
    var result = query.generate();
    assert.equal(result.sql, 'select * from (primary_keys)');
  });

  it('should select foreign_keys', function() {
    const query = pool.metaData.select().from('foreign_keys');
    var result = query.generate();
    assert.equal(result.sql, 'select * from (foreign_keys)');
  });

  it('should select schemas (with connection)', function(done) {
    pool.connect(function(err, conn) {
      try {
        const query = conn.metaData.select('name').from('schemas');
        var result = query.generate();
        assert.equal(result.sql, 'select name from (schemas)');
      } catch (e) {
        conn.release();
        return done(e);
      }
      conn.release();
      done();
    });
  });

  it('should throw error for unknown selector', function() {
    try {
      pool.metaData.select().from('invalid');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('shutdown pool', function(done) {
    pool.close(done);
  });

});