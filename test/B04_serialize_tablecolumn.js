/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../');

describe('serialize "SelectColumn"', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should serialize (field)', function() {
    let query = sqb.select('field1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select field1 from table1');
  });

  it('should serialize (field alias)', function() {
    let query = sqb.select('field1 f1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select field1 f1 from table1');
  });

  it('should serialize (table.field)', function() {
    let query = sqb.select('table1.field1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select table1.field1 from table1');
  });

  it('should serialize (table.field alias)', function() {
    let query = sqb.select('table1.field1 f1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select table1.field1 f1 from table1');
  });

  it('should serialize (schema.table.field)', function() {
    let query = sqb.select('schema1.table1.field1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select schema1.table1.field1 from table1');
  });

  it('should serialize (schema.table.field alias)', function() {
    let query = sqb.select('schema1.table1.field1 f1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select schema1.table1.field1 f1 from table1');
  });

  it('should table and column start with "_" character', function() {
    let query = sqb.select('_table1._field1 _f1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select _table1._field1 _f1 from table1');
  });

  it('should "$" character can be used for table and column names', function() {
    let query = sqb.select('table1$.field1$ f1$').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select table1$.field1$ f1$ from table1');
  });

  it('should not table name start with "$" character', function() {
    try {
      sqb.select('$table1.field1 f1').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should not column name start with "$" character', function() {
    try {
      sqb.select('table1.$field1 f1').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should not alias name start with "$" character', function() {
    try {
      sqb.select('table1.field1 $f1').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should not print alias if field is *', function() {
    let query = sqb.select('schema1.table1.* f1').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select schema1.table1.* from table1');
  });

  it('should place into double quote if field name is reserved', function() {
    let query = sqb.select('with').from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select "with" from table1');
  });

  it('should validate schema name', function() {
    try {
      sqb.select('a+.table1.field1 f1').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate table name', function() {
    try {
      sqb.select('a+.field1 f1').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate field name', function() {
    try {
      sqb.select('a+ f1').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate alias', function() {
    try {
      sqb.select('field1 a+').from('table1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
