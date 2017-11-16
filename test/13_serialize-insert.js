/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert query', function() {

  var serializer;

  before(function() {
    serializer = new sqb.serializer({
      dialect: 'test',
      prettyPrint: false
    });
  });

  it('should serialize formal insert query with Object values', function() {
    var query = sqb.insert('id', 'name')
        .into()
        .into('table1')
        .values()
        .values({id: 1, name: 'aaa'});
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should serialize formal insert query with Array values', function() {
    var query = sqb.insert('id', 'name', 'address')
        .into('table1')
        .values([1, 'aaa']);
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (id, name, address) values (1, \'aaa\', null)');
  });

  it('should serialize insert query with Object argument', function() {
    var query = sqb.insert({id: 1, name: 'aaa'})
        .into('table1');
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should skip empty columns', function() {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({
          id: 1,
          name: 'aaa'
        });
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should serialize params in "values"', function() {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK,
      prettyPrint: false
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepEqual(result.values, [1, 'aaa']);
  });

  it('should serialize COLON param type', function() {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.COLON,
      prettyPrint: false
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepEqual(result.values, {id: 1, name: 'aaa'});
  });

  it('should serialize QUESTION_MARK param type', function() {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK,
      prettyPrint: false
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepEqual(result.values, [1, 'aaa']);
  });

  it('should serialize DOLLAR param type', function() {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.DOLLAR,
      prettyPrint: false
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values ($1, $2)');
    assert.deepEqual(result.values, [1, 'aaa']);
  });

  it('should serialize array params', function() {
    var query = sqb.insert('id', 'name', 'address')
        .into('table1')
        .values([/id/, 'name', /address/]);
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK,
      prettyPrint: false
    }, [1, 'earth']);
    assert.equal(result.sql, 'insert into table1 (id, name, address) values (?, \'name\', ?)');
    assert.deepEqual(result.values, [1, 'earth']);
  });

  it('should serialize Raw in table name', function() {
    var query = sqb.insert('id', 'name')
        .into(sqb.raw('table1'))
        .values({id: 1, name: 'aaa'});
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should serialize insert/select query', function() {
    var query = sqb.insert('ID', 'NAME').into('table1').values(
        sqb.select('id', 'name').from('table2').where(['id', '>', 5])
    );
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (ID, NAME) select id, name from table2 where id > 5');
  });

  it('should use raw in values', function() {
    var query = sqb.insert('ID', 'NAME').into('table1').values(
        sqb.raw('values (1,2)')
    );
    var result = serializer.generate(query);
    assert.equal(result.sql, 'insert into table1 (ID, NAME) values (1,2)');
  });

  it('should check arguments in .values()', function() {
    try {
      sqb.insert('id', 'name').into(sqb.raw('table1')).values(1);
    } catch (e) {
      return
    }
    assert(0, 'Failed');
  });

  it('should validate returning() arguments', function() {
    try {
      sqb.insert({id: 1})
          .into('table1')
          .returning(1234);
    } catch (e) {
      sqb.insert({id: 1})
          .into('table1')
          .returning(null);
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate returning() data types', function() {
    try {
      sqb.insert({id: 1})
          .into('table1')
          .returning({id: 'invalid'});
    } catch (e) {
      sqb.insert({id: 1})
          .into('table1')
          .returning({id: 'string'});
      return;
    }
    assert(0, 'Failed');
  });

});