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
  var schema;
  var table;

  after(function() {
    pool.close(true);
  });

  it('should throw error if driver does not support metaData', function() {
    const old = pool._driver.metaData;
    try {
      pool._driver.metaData = null;
      pool.metaData.select().from('tables');
    } catch (e) {
      pool._driver.metaData = old;
      return;
    }
    assert(0, 'Failed');
  });

  it('should create select query for schemas', function() {
    var q = pool.metaData.select().from('schemas').generate();
    assert.equal(q.sql, 'select * from (select * from schemas) t');
  });

  it('should create select query for tables', function() {
    var q = pool.metaData.select().from('tables').generate();
    assert.equal(q.sql, 'select * from (select * from tables) t');
  });

  it('should create select query for columns', function() {
    var q = pool.metaData.select().from('columns').generate();
    assert.equal(q.sql, 'select * from (select * from columns) t');
  });

  it('should create select query for primary keys', function() {
    var q = pool.metaData.select().from('primary_keys').generate();
    assert.equal(q.sql, 'select * from (select * from primary_keys) t');
  });

  it('should create select query for foreign keys', function() {
    var q = pool.metaData.select().from('foreign_keys').generate();
    assert.equal(q.sql, 'select * from (select * from foreign_keys) t');
  });

  it('should not create select query for invalid selector', function() {
    try {
      pool.metaData.select().from('invalid').generate();
    } catch (e) {
      return;
    }
    throw new Error('Failed');
  });

  it('should get schema objects', function(done) {
    pool.metaData.getSchemas(function(err, schemas) {
      if (err)
        return done(err);
      try {
        assert.equal(schemas.length, 2);
        schema = schemas[0];
        assert.equal(schema.meta.schema_name, 'SCHEMA_1');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should get schema objects (Promise)', function(done) {
    pool.metaData.getSchemas('schema_1').then(function(schemas) {
      assert.equal(schemas.length, 2);
      schema = schemas[0];
      assert.equal(schema.meta.schema_name, 'SCHEMA_1');
      done();
    }).catch(function(reason) {
      done(reason);
    });
  });

  it('should get table object', function(done) {
    schema.getTables(function(err, tables) {
      if (err)
        return done(err);
      try {
        assert.equal(tables.length, 3);
        table = tables[0];
        assert.equal(table.meta.table_name, 'AIRPORTS');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should get table objects (Promise)', function(done) {
    schema.getTables('airports').then(function(tables) {
      assert.equal(tables.length, 3);
      table = tables[0];
      assert.equal(table.meta.table_name, 'AIRPORTS');
      done();
    }).catch(function(reason) {
      done(reason);
    });
  });

  it('should get single table info', function(done) {
    table.refresh(function(err) {
      if (err)
        return done(err);
      try {
        assert(table.columns);
        assert(table.columns.ID);
        assert.equal(table.columns.ID.data_type, 'TEXT');
        assert(table.primaryKey);
        assert.equal(table.primaryKey.columns, 'ID');
        assert(table.foreignKeys);
        assert(table.foreignKeys.length);
        assert.equal(table.foreignKeys[0].columns, 'REGION');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should get single table info (Promise)', function(done) {
    table.refresh().then(function() {

      assert(table.columns);
      assert(table.columns.ID);
      assert.equal(table.columns.ID.data_type, 'TEXT');
      assert(table.primaryKey);
      assert.equal(table.primaryKey.columns, 'ID');
      assert(table.foreignKeys);
      assert(table.foreignKeys.length);
      assert.equal(table.foreignKeys[0].columns, 'REGION');
      done();
    }).catch(function(reason) {
      done(reason);
    });
  });

  it('should call invalidate()', function() {
    assert(pool.metaData.invalidate());
  });

  describe('Finalize', function() {
    it('shutdown pool', function(done) {
      pool.close(done);
    });
  });

});
