/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('serialize "OrderColumn"', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };
  
  it('should serialize (field)', function() {
    var query = sqb.select().from('table1').orderBy('field1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (table.field)', function() {
    var query = sqb.select().from('table1').orderBy('table1.field1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by table1.field1');
  });

  it('should serialize (schema.table.field)', function() {
    var query = sqb.select().from('table1').orderBy('schema1.table1.field1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by schema1.table1.field1');
  });

  it('should serialize (+field)', function() {
    var query = sqb.select().from('table1').orderBy('+field1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (-field)', function() {
    var query = sqb.select().from('table1').orderBy('-field1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1 desc');
  });

  it('should serialize (field asc)', function() {
    var query = sqb.select().from('table1').orderBy('field1 asc');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (field ascending)', function() {
    var query = sqb.select().from('table1').orderBy('field1 ascending');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1');
  });

  it('should serialize (field desc)', function() {
    var query = sqb.select().from('table1').orderBy('field1 desc');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1 desc');
  });

  it('should serialize (field descending)', function() {
    var query = sqb.select().from('table1').orderBy('field1 descending');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by field1 desc');
  });

  it('should place into double quote if field name is reserved', function() {
    var query = sqb.select().from('table1').orderBy('with descending');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 order by "with" desc');
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
