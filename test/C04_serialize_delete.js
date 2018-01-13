/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('Serialize delete query', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize DeleteQuery', function() {
    const q = sqb.delete('table1');
    assert(q.isQuery && q.isDelete);
  });

  it('should serialize delete', function() {
    var query = sqb.delete('table1')
        .where(Op.eq('id', 1));
    var result = query.generate(options);
    assert.equal(result.sql, 'delete from table1 where id = 1');
  });

  it('should pass raw as table name', function() {
    var query = sqb.delete(sqb.raw('table1'));
    var result = query.generate(options);
    assert.equal(result.sql, 'delete from table1');
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