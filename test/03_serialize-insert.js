/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert query', function() {

  it('should serialize formal insert query with Object values', function(done) {
    var query = sqb.insert('id', 'name')
        .into()
        .into('table1')
        .values()
        .values({id: 1, name: 'aaa'});
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK
    });
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should serialize formal insert query with Array values', function(done) {
    var query = sqb.insert('id', 'name', 'address')
        .into('table1')
        .values([1, 'aaa']);
    var result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name, address) values (1, \'aaa\', null)');
    done();
  });

  it('should serialize insert query with Object argument', function(done) {
    var query = sqb.insert({id: 1, name: 'aaa'})
        .into('table1');
    var result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should skip empty columns', function(done) {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({
          id: 1,
          name: 'aaa'
        });
    var result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should serialize params in "values"', function(done) {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepEqual(result.values, [1, 'aaa']);
    done();
  });

  it('should serialize COLON param type', function(done) {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.COLON
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepEqual(result.values, {id: 1, name: 'aaa'});
    done();
  });

  it('should serialize QUESTION_MARK param type', function(done) {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepEqual(result.values, [1, 'aaa']);
    done();
  });

  it('should serialize DOLLAR param type', function(done) {
    var query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    var result = query.generate({
      paramType: sqb.ParamType.DOLLAR
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values ($1, $2)');
    assert.deepEqual(result.values, [1, 'aaa']);
    done();
  });

  it('should serialize array params', function(done) {
    var query = sqb.insert('id', 'name', 'address')
        .into('table1')
        .values([/id/, 'name', /address/]);
    var result = query.generate({
      paramType: sqb.ParamType.QUESTION_MARK
    }, [1, 'earth']);
    assert.equal(result.sql, 'insert into table1 (id, name, address) values (?, \'name\', ?)');
    assert.deepEqual(result.values, [1, 'earth']);
    done();
  });

  it('should serialize Raw in table name', function(done) {
    var query = sqb.insert('id', 'name')
        .into(sqb.raw('table1'))
        .values({id: 1, name: 'aaa'});
    var result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should serialize insert/select query', function(done) {
    var query = sqb.insert('ID', 'NAME').into('table1').values(
        sqb.select('id', 'name').from('table2').where(['id', '>', 5])
    );
    var result = query.generate();
    assert.equal(result.sql, 'insert into table1 (ID, NAME) select id, name from table2 where id > 5');
    done();
  });

  it('should use raw in values', function(done) {
    var query = sqb.insert('ID', 'NAME').into('table1').values(
        sqb.raw('values (1,2)')
    );
    var result = query.generate();
    assert.equal(result.sql, 'insert into table1 (ID, NAME) values (1,2)');
    done();
  });

  it('should check arguments in .values()', function(done) {
    var ok;
    try {
      sqb.insert('id', 'name').into(sqb.raw('table1')).values(1);
    } catch (e) {
      ok = true;
    }
    assert.ok(ok);
    done();
  });

});