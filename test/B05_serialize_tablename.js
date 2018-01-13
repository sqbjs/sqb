/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('serialize "TableName"', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should serialize (table)', function() {
    var query = sqb.select().from('table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1');
  });

  it('should serialize (table alias)', function() {
    var query = sqb.select().from('table1 t1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1');
  });

  it('should serialize (schema.table)', function() {
    var query = sqb.select().from('schema1.table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from schema1.table1');
  });

  it('should serialize (schema.table alias)', function() {
    var query = sqb.select().from('schema1.table1 t1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from schema1.table1 t1');
  });

  it('should validate schema name', function() {
    try {
      sqb.select().from('1sch.table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate table name', function() {
    try {
      sqb.select().from('sch.1table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate alias', function() {
    try {
      sqb.select().from('sch.table1 c+');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
