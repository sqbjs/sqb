/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('serialize "Case"', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize Case', function() {
    assert(sqb.case().isCase);
  });

  it('should serialize single condition in "when"', function() {
    var query = sqb.select(
        sqb.case().when(Op.gt('age', 16)).then(1).else(0)
    ).from('table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select case when age > 16 then 1 else 0 end from table1');
  });

  it('should serialize without condition in "when"', function() {
    var query = sqb.select(
        sqb.case().when().then(1).else(100)
    ).from('table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1');
  });

  it('should serialize group of conditions in "when"', function() {
    var query = sqb.select(
        sqb.case().when(Op.gt('col1', 4), Op.lt('col1', 8)).then(1).else(100)
    ).from('table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select case when col1 > 4 and col1 < 8 then 1 else 100 end from table1');
  });

  it('should serialize alias', function() {
    var query = sqb.select(
        sqb.case().when(Op.eq('col1', 5)).then(1).as('col1')
    ).from('table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select case when col1 = 5 then 1 end col1 from table1');
  });

});
