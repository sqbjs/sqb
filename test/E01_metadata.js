/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');

describe('Metadata', function() {

  let pool;
  let metaData;
  before(() => {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      defaults: {
        fetchRows: 10,
        prettyPrint: false
      }
    });

  });
  let schema;
  let table;

  after(() => pool.close(true));

  it('should validate arguments', function() {
    try {
      new sqb.DBMeta();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should initialize with pool', function() {
    metaData = new sqb.DBMeta(pool);
  });

  it('should initialize with connection', function() {
    return pool.acquire((conn) => {
      new sqb.DBMeta(conn);
    });
  });

  it('should create select query for schemas', function() {
    let q = metaData.select().from('schemas').generate();
    assert.equal(q.sql, 'select * from (select * from schemas) schemas');
  });

  it('should create select query for tables', function() {
    let q = metaData.select().from('tables').generate();
    assert.equal(q.sql, 'select * from (select * from tables) tables');
  });

  it('should create select query for columns', function() {
    let q = metaData.select().from('columns').generate();
    assert.equal(q.sql, 'select * from (select * from columns) columns');
  });

  it('should create select query for primary keys', function() {
    let q = metaData.select().from('primary_keys').generate();
    assert.equal(q.sql, 'select * from (select * from primary_keys) primary_keys');
  });

  it('should create select query for foreign keys', function() {
    let q = metaData.select().from('foreign_keys').generate();
    assert.equal(q.sql, 'select * from (select * from foreign_keys) foreign_keys');
  });

  it('should not create select query for invalid selector', function() {
    try {
      metaData.select().from('invalid').generate(options);
    } catch (e) {
      return;
    }
    throw new Error('Failed');
  });

  it('should get schema objects', function() {
    return metaData.getSchemas().then(schemas => {
      assert.equal(schemas.length, 2);
      schema = schemas[0];
      assert.equal(schema.name, 'SCHEMA_1');
    });
  });

  describe('SchemaMeta', function() {

    it('should get table object', function() {
      return schema.getTables().then(tables => {
        assert.equal(tables.length, 3);
        table = tables[0];
        assert.equal(table.name, 'AIRPORTS');
      });
    });
  });

  describe('TableMeta', function() {

    it('should get columns', function() {
      return table.getColumns().then(result => {
        assert(result);
        assert(result.ID);
        assert.equal(result.ID.data_type, 'TEXT');
      });
    });

    it('should get primary key )', function() {
      return table.getPrimaryKey().then(result => {
        assert(result);
        assert.equal(result.columns, 'ID');
      });
    });

    it('should get foreign keys', function() {
      return table.getForeignKeys().then(result => {
        assert(result);
        assert(result.length);
        assert.equal(result[0].column, 'REGION');
      });
    });

  });

  it('should call invalidate()', function() {
    assert(metaData.invalidate());
  });

  it('should provide that dialect supports schemas', function() {
    metaData = new sqb.DBMeta(pool);
    assert.equal(metaData.supportsSchemas, false);
  });

  describe('Finalize', function() {
    it('should have no active connection after all tests', function() {
      assert.equal(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });
  });

});
