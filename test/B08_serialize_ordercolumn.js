/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../');

describe('serialize "OrderColumn"', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };
  
  it('should serialize (field)', function() {
    let query = sqb.select().from('table1').orderBy('field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (table.field)', function() {
    let query = sqb.select().from('table1').orderBy('table1.field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by table1.field1');
  });

  it('should serialize (schema.table.field)', function() {
    let query = sqb.select().from('table1').orderBy('schema1.table1.field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by schema1.table1.field1');
  });

  it('should serialize (+field)', function() {
    let query = sqb.select().from('table1').orderBy('+field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (-field)', function() {
    let query = sqb.select().from('table1').orderBy('-field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1 desc');
  });

  it('should serialize (field asc)', function() {
    let query = sqb.select().from('table1').orderBy('field1 asc');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (field ascending)', function() {
    let query = sqb.select().from('table1').orderBy('field1 ascending');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (field desc)', function() {
    let query = sqb.select().from('table1').orderBy('field1 desc');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1 desc');
  });

  it('should serialize (field descending)', function() {
    let query = sqb.select().from('table1').orderBy('field1 descending');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1 desc');
  });

  it('should place into double quote if field name is reserved', function() {
    let query = sqb.select().from('table1').orderBy('with descending');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by "with" desc');
  });

  it('should validate schema name', function() {
    try {
      sqb.select().from('table1').orderBy('1sch.field1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate table name', function() {
    try {
      sqb.select().from('table1').orderBy('schema.1field1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate order word', function() {
    try {
      sqb.select().from('table1').orderBy('schema.field1 dss');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
