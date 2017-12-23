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

  it('should create select query for schemas', function() {
    var q = pool.metaData.select().from('schemas').generate();
    assert.equal(q.sql, 'select * from (select * from schemas) schemas');
  });

  it('should create select query for tables', function() {
    var q = pool.metaData.select().from('tables').generate();
    assert.equal(q.sql, 'select * from (select * from tables) tables');
  });

  it('should create select query for columns', function() {
    var q = pool.metaData.select().from('columns').generate();
    assert.equal(q.sql, 'select * from (select * from columns) columns');
  });

  it('should create select query for primary keys', function() {
    var q = pool.metaData.select().from('primary_keys').generate();
    assert.equal(q.sql, 'select * from (select * from primary_keys) primary_keys');
  });

  it('should create select query for foreign keys', function() {
    var q = pool.metaData.select().from('foreign_keys').generate();
    assert.equal(q.sql, 'select * from (select * from foreign_keys) foreign_keys');
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

  describe('SchemaMeta', function() {
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
  });

  describe('TableMeta', function() {

    it('should get columns', function(done) {
      table.getColumns(function(err, result) {
        if (err)
          return done(err);
        try {
          assert(result);
          assert(result.ID);
          assert.equal(result.ID.data_type, 'TEXT');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should get columns (Promise)', function() {
      return table.getColumns().then(function(result) {
        assert(result);
        assert(result.ID);
        assert.equal(result.ID.data_type, 'TEXT');
      });
    });

    it('should get primary key', function(done) {
      table.getPrimaryKey(function(err, result) {
        if (err)
          return done(err);
        try {
          assert(result);
          assert.equal(result.columns, 'ID');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should get columns (Promise)', function() {
      return table.getPrimaryKey().then(function(result) {
        assert(result);
        assert.equal(result.columns, 'ID');
      });
    });

    it('should get foreign keys', function(done) {
      table.getForeignKeys(function(err, result) {
        if (err)
          return done(err);
        try {
          assert(result);
          assert(result.length);
          assert.equal(result[0].column, 'REGION');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should get columns (Promise)', function() {
      return table.getForeignKeys().then(function(result) {
        assert(result);
        assert(result.length);
        assert.equal(result[0].column, 'REGION');
      });
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
