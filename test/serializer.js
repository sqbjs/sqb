/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serializer', function() {

  it('should configure', function(done) {
    let serializer = sqb.serializer({
      prettyPrint: 1,
      namedParams: 1
    });
    assert.equal(serializer.prettyPrint, true);
    assert.equal(serializer.namedParams, true);
    done();
  });

  it('should check arguments in .build()', function(done) {
    let ok;
    try {
      let serializer = sqb.serializer();
      serializer.build(1);
    } catch (e) {
      ok = true;
    }
    assert.ok(ok);
    done();
  });

  it('Should pretty print - test1', function(done) {
    let query = sqb.select('field1')
        .from('table1')
        .join(sqb.join('table2'));
    let result = query.build({
      prettyPrint: true
    });
    assert.equal(result.sql, 'select field1 from table1\ninner join table2');
    done();
  });

  it('Should pretty print - test2', function(done) {
    let query = sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6')
        .from('table1')
        .join(sqb.join('table2'));
    let result = query.build({
      prettyPrint: true
    });
    assert.equal(result.sql, 'select field1, field2, field3, field4, field5, field6 from table1\ninner join table2');
    done();
  });

  it('Should pretty print - test3', function(done) {
    let query = sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6')
        .from('table1')
        .where(
            ['field1', 'abcdefgh1234567890'],
            ['field2', 'abcdefgh1234567890'],
            ['field3', 'abcdefgh1234567890']
        )
        .orderBy('ID');
    let result = query.build({
      prettyPrint: true
    });
    assert.equal(result.sql,
        'select field1, field2, field3, field4, field5, field6 from table1\n' +
        'where field1 = \'abcdefgh1234567890\' and field2 = \'abcdefgh1234567890\' and\n' +
        '  field3 = \'abcdefgh1234567890\'\n' +
        'order by ID');
    done();
  });

  it('Should pretty print - test4', function(done) {
    let query = sqb.select('field1', sqb.select('field2').from('table2'))
        .from('table1')
        .where(
            ['field1', 1]
        )
        .orderBy('ID');
    let result = query.build({
      prettyPrint: true
    });
    assert.equal(result.sql,
        'select field1, (select field2 from table2) from table1 where field1 = 1\n' +
        'order by ID');
    done();
  });

  it('Should serialize indexed params', function(done) {
    let query = sqb.select().from('table1').where(['ID', /ID/]);
    let result = query.build({
      namedParams: false
    }, {id: 5});
    assert.equal(result.sql, 'select * from table1 where ID = ?');
    assert.deepEqual(result.params, [5]);
    done();
  });

  it('should return serializer that already passed in first argument', function(done) {
    let obj = sqb.serializer();
    let obj2 = sqb.serializer(obj);
    assert.ok(obj === obj2);
    done();
  });

  it('Should register serializer class', function(done) {
    sqb.Serializer.register('test', sqb.Serializer);
    done();
  });

  it('Should get serializer class', function(done) {
    let clazz = sqb.Serializer.get('test');
    assert.equal(clazz, sqb.Serializer);
    done();
  });

  it('Should create serializer', function(done) {
    let serializer = sqb.Serializer.create('test');
    assert.ok(serializer);
    done();
  });

});