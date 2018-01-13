/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('serialize "Join"', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };
  
  it('should initialize Join', function() {
    assert(sqb.join('table1').isJoin);
  });

  it('should serialize (join)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.join('table2 t2').on());
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 inner join table2 t2');
  });

  it('should serialize (innerJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.innerJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 inner join table2 t2');
  });

  it('should serialize (leftJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.leftJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 left join table2 t2');
  });

  it('should serialize (leftOuterJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.leftOuterJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 left outer join table2 t2');
  });

  it('should serialize (rightJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.rightJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 right join table2 t2');
  });

  it('should serialize (rightOuterJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.rightOuterJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 right outer join table2 t2');
  });

  it('should serialize (outerJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.outerJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 outer join table2 t2');
  });

  it('should serialize (fullOuterJoin)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.fullOuterJoin('table2 t2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 full outer join table2 t2');
  });

  it('should serialize conditions', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.join('table2 t2').on(Op.eq('t2.id', sqb.raw('t1.id'))));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 inner join table2 t2 on t2.id = t1.id');
  });

  it('should serialize sub-select as table', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.join(
            sqb.select().from('table2').as('t2')
        ));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 inner join (select * from table2) t2');
  });

  it('should serialize sub-select as table (pretty)', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.join(
            sqb.select('field1', 'field2', 'field3', 'field4', 'field5')
                .from('table2')
                .as('t2')
        ));
    var result = query.generate();
    assert.equal(result.sql, 'select * from table1 t1\n' +
        'inner join (\n' +
        '  select field1, field2, field3, field4, field5 from table2\n' +
        ') t2');
  });

  it('should serialize Raw as table', function() {
    var query = sqb.select().from('table1 t1')
        .join(sqb.join(sqb.raw('table2 t2')));
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 t1 inner join table2 t2');
  });

  it('should validate first argument', function() {
    try {
      sqb.join(1);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate alias for sub-select', function() {
    try {
      var query = sqb.select().from('table1 t1')
          .join(sqb.join(sqb.select().from('table2')));
      query.generate();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
