/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../');

describe('serialize "GroupColumn"', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should serialize (field)', function() {
    let query = sqb.select().from('table1').groupBy('field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 group by field1');
  });

  it('should serialize (table.field)', function() {
    let query = sqb.select().from('table1').groupBy('table1.field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 group by table1.field1');
  });

  it('should serialize (schema.table.field)', function() {
    let query = sqb.select().from('table1').groupBy('schema1.table1.field1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 group by schema1.table1.field1');
  });

  it('should place into double quote if field name is reserved', function() {
    let query = sqb.select().from('table1').groupBy('schema1.table1.with');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 group by schema1.table1."with"');
  });

  it('should validate schema name', function() {
    try {
      sqb.select().from('table1').groupBy('1sch.field1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate table name', function() {
    try {
      sqb.select().from('table1').groupBy('schema.-field1');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate order word', function() {
    try {
      sqb.select().from('table1').groupBy('schema.field1 dss');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
