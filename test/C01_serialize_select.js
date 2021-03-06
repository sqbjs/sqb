/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('serialize "SelectQuery"', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize SelectQuery', function() {
    const q = sqb.select();
    assert(q.isQuery && q.isSelect);
  });

  it('should serialize * for when no columns given', function() {
    let query = sqb.select('*').columns().from('table1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1');
  });

  it('should serialize when no tables given', function() {
    let query = sqb.select();
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select *');
  });

  it('should serialize simple query', function() {
    let query = sqb.select('field1', 'field2', 'field3',
        'field4', 'field5', 'field6', 'field7', 'field8', 'field9', 'field10',
        'field11', 'field12', 'field13', 'field14', 'field15', 'field16'
    ).from('table1');
    let result = query.generate({
      prettyPrint: true
    });
    assert.strictEqual(result.sql, 'select\n' +
        '  field1, field2, field3, field4, field5, field6, field7, field8,\n' +
        '  field9, field10, field11, field12, field13, field14, field15,\n' +
        '  field16\n' +
        'from table1');
  });

  it('should pass array as columns', function() {
    let query = sqb.select(['field1', 'field2'], 'field3',
        'field4', ['field5', 'field6', 'field7', 'field8', 'field9'],
        'field10').from('table1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select field1, field2, field3, field4, field5, ' +
        'field6, field7, field8, field9, field10 from table1');
  });

  it('should skip empty columns, tables, joins, group columns and order columns', function() {
    let query = sqb.select('field1', '')
        .from('schema1.table1 t1', '')
        .join(null)
        .groupBy('')
        .orderBy('');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select field1 from schema1.table1 t1');
  });

  it('should serialize raw in columns', function() {
    let query = sqb.select(sqb.raw('\'John\'\'s Bike\' f1'))
        .from('table1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select \'John\'\'s Bike\' f1 from table1');
  });

  it('should serialize sub-select in columns', function() {
    let query = sqb.select(sqb.select('id').from('table2').as('id2'))
        .from('table1');
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select (select id from table2) id2 from table1');
  });

  it('should serialize raw in "from" part', function() {
    let query = sqb.select().from('table1', sqb.raw('func1()'));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1,func1()');
  });

  it('should serialize sub-select in "from"', function() {
    let query = sqb.select()
        .from(sqb.select('field1', 'field2', 'field3',
            'field4', 'field5', 'field6', 'field7', 'field8').from('table1')
            .as('t1'));
    let result = query.generate(options);
    assert.strictEqual(result.sql,
        'select * from ' +
        '(select field1, field2, field3, field4, field5, field6, field7, field8 ' +
        'from table1) t1');
  });

  it('should serialize raw in "order by"', function() {
    let query = sqb.select()
        .from('table1')
        .orderBy(sqb.raw('field1'));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 order by field1');
  });

  it('should pretty print - test1', function() {
    let query = sqb.select()
        .from(sqb.select('field1', 'field2', 'field3',
            'field4', 'field5', 'field6', 'field7', 'field8').from('table1')
            .as('t1'));
    let result = query.generate();
    assert.strictEqual(result.sql,
        'select * from\n' +
        '  (select field1, field2, field3, field4, field5, field6, field7, field8\n' +
        '  from table1) t1');
  });

  it('should pretty print - test2', function() {
    let query = sqb.select()
        .from('table1')
        .where(
            Op.eq('ID', 1),
            Op.eq('name', 'value of the field should be too long'),
            Op.eq('ID', 1), Op.eq('ID', 12345678)
        )
        .groupBy('field1', 'field2', sqb.raw('field3'));
    let result = query.generate();
    assert.strictEqual(result.sql, 'select * from table1\n' +
        'where ID = 1 and name = \'value of the field should be too long\' and\n' +
        '  ID = 1 and ID = 12345678\n' +
        'group by field1, field2, field3');
  });

  it('should assign limit ', function() {
    let query = sqb.select().from('table1').limit(5);
    assert.strictEqual(query._limit, 5);
  });

  it('should assign offset ', function() {
    let query = sqb.select().from('table1').offset(5);
    assert.strictEqual(query._offset, 5);
  });

  it('should pass only Join instance to join() function', function() {
    try {
      sqb.select().from('table1').join('dfd');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate alias for sub-select in columns', function() {
    try {
      let query = sqb.select(
          sqb.select().from('table2')
      ).from('table1 t1');
      query.generate();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate alias for sub-select in "from"', function() {
    try {
      let query = sqb.select().from(
          sqb.select().from('table2'));
      query.generate();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

});
