/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serializer', function() {

  it('should configure', function() {
    var serializer = sqb.serializer({
      prettyPrint: 0
    });
    assert(serializer.prettyPrint);
    assert.equal(serializer.paramType, sqb.ParamType.COLON);
    assert(!serializer.strictParams);
    serializer.prettyPrint = 1;
    assert.equal(serializer.prettyPrint, true);
    serializer.paramType = sqb.ParamType.COLON;
    assert.equal(serializer.paramType, sqb.ParamType.COLON);
    serializer.strictParams = 1;
    assert.equal(serializer.strictParams, true);
    sqb.use(require('./support/test_serializer'));
  });

  it('should check arguments in .generate()', function() {
    try {
      var serializer = sqb.serializer();
      serializer.generate(1);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('Should pretty print - test1', function() {
    var query = sqb.select('field1')
        .from('table1')
        .join(sqb.join('table2'));
    var result = query.generate({
      prettyPrint: true
    });
    assert.equal(result.sql, 'select field1 from table1\ninner join table2');
  });

  it('Should pretty print - test2', function() {
    var query = sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6')
        .from('table1')
        .join(sqb.join('table2'));
    var result = query.generate({
      prettyPrint: true
    });
    assert.equal(result.sql, 'select field1, field2, field3, field4, field5, field6 from table1\ninner join table2');
  });

  it('Should pretty print - test3', function() {
    var query = sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6')
        .from('table1')
        .where(
            ['field1', 'abcdefgh1234567890'],
            ['field2', 'abcdefgh1234567890'],
            ['field3', 'abcdefgh1234567890']
        )
        .orderBy('ID');
    var result = query.generate({
      prettyPrint: true
    });
    assert.equal(result.sql,
        'select field1, field2, field3, field4, field5, field6 from table1\n' +
        'where field1 = \'abcdefgh1234567890\' and field2 = \'abcdefgh1234567890\' and\n' +
        '  field3 = \'abcdefgh1234567890\'\n' +
        'order by ID');
  });

  it('Should pretty print - test4', function() {
    var query = sqb.select('field1', sqb.select('field2').from('table2'))
        .from('table1')
        .where(
            ['field1', 1]
        )
        .orderBy('ID');
    var result = query.generate({
      prettyPrint: true
    });
    assert.equal(result.sql,
        'select field1, (select field2 from table2) from table1 where field1 = 1\n' +
        'order by ID');
  });

  it('Should serialize COLON params', function() {
    var query = sqb.select().from('table1').where(['ID', /ID/]);
    var result = query.generate({
      paramType: sqb.ParamType.COLON
    }, {ID: 5});
    assert.equal(result.sql, 'select * from table1 where ID = :ID');
    assert.deepEqual(result.values, {ID: 5});
  });

  it('Should serialize QUESTION_MARK params', function() {
    var query = sqb.select().from('table1')
        .where(['ID', /ID/],
            ['DT', 'between', /dt/],
            ['DT2', 'between', /dt2/],
            ['ID4', /ID4/]
        );
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK,
      prettyPrint: false
    }, {ID: 5, dt: [1, 3], dt2: 2});
    assert.equal(result.sql, 'select * from table1 where ID = ? and DT between ? and ? and DT2 between ? and ? and ID4 = ?');
    assert.deepEqual(result.values, [5, 1, 3, 2, 2, null]);
  });

  it('Should serialize DOLLAR params', function() {
    var query = sqb.select().from('table1')
        .where(['ID', /ID/],
            ['DT', 'between', /dt/],
            ['DT2', 'between', /dt2/],
            ['ID4', /ID4/]
        );
    var result = query.generate({
      paramType: sqb.ParamType.DOLLAR,
      prettyPrint: false
    }, {ID: 5, dt: [1, 3], dt2: 2});
    assert.equal(result.sql, 'select * from table1 where ID = $1 and DT between $2 and $3 and DT2 between $4 and $5 and ID4 = $6');
    assert.deepEqual(result.values, [5, 1, 3, 2, 2, null]);
  });

  it('Should serialize AT params', function() {
    var query = sqb.select().from('table1').where(['ID', /ID/]);
    var result = query.generate({
      paramType: sqb.ParamType.AT
    }, {ID: 5});
    assert.equal(result.sql, 'select * from table1 where ID = @ID');
    assert.deepEqual(result.values, {ID: 5});
  });

  it('should return serializer that already passed in first argument', function() {
    var obj = sqb.serializer();
    var obj2 = sqb.serializer(obj);
    assert.ok(obj === obj2);
  });

});