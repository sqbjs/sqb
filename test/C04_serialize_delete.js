/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('Serialize delete query', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize DeleteQuery', function() {
    const q = sqb.delete('table1');
    assert(q.isQuery && q.isDelete);
  });

  it('should serialize delete', function() {
    let query = sqb.delete('table1')
        .where(Op.eq('id', 1));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'delete from table1 where id = 1');
  });

  it('should pass raw as table name', function() {
    let query = sqb.delete(sqb.raw('table1'));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'delete from table1');
  });

  it('should validate first (tableName) argument', function() {
    try {
      sqb.delete(null);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
