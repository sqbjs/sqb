/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert query', function() {

  it('should serialize formal insert query with Object values', function(done) {
    let query = sqb.insert('id', 'name')
        .into()
        .into('table1')
        .values()
        .values({id: 1, name: 'aaa'});
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should serialize formal insert query with Array values', function(done) {
    let query = sqb.insert('id', 'name', 'address')
        .into('table1')
        .values([1, 'aaa']);
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name, address) values (1, \'aaa\', null)');
    done();
  });

  it('should serialize insert query with Object argument', function(done) {
    let query = sqb.insert({id: 1, name: 'aaa'})
        .into('table1');
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should skip empty columns', function(done) {
    let query = sqb.insert('id', 'name')
        .into('table1')
        .values({
          id: 1,
          name: 'aaa'
        });
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should serialize params in "values"', function(done) {
    let query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    let result = query.generate({}, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepEqual(result.values, [1, 'aaa']);
    done();
  });

  it('should serialize named params', function(done) {
    let query = sqb.insert('id', 'name')
        .into('table1')
        .values({id: /id/, name: /name/});
    let result = query.generate({
      namedParams: true
    }, {id: 1, name: 'aaa'});
    assert.equal(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepEqual(result.values, {id: 1, name: 'aaa'});
    done();
  });

  it('should serialize array params', function(done) {
    let query = sqb.insert('id', 'name', 'address')
        .into('table1')
        .values([/id/, 'name', /address/]);
    let result = query.generate({}, [1, 'earth']);
    assert.equal(result.sql, 'insert into table1 (id, name, address) values (?, \'name\', ?)');
    assert.deepEqual(result.values, [1, 'earth']);
    done();
  });

  it('should serialize Raw in table name', function(done) {
    let query = sqb.insert('id', 'name')
        .into(sqb.raw('table1'))
        .values({id: 1, name: 'aaa'});
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    done();
  });

  it('should serialize insert/select query', function(done) {
    let query = sqb.insert('ID', 'NAME').into('table1').values(
        sqb.select('id', 'name').from('table2').where(['id', '>', 5])
    );
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (ID, NAME) select id, name from table2 where id > 5');
    done();
  });

  it('should use raw in values', function(done) {
    let query = sqb.insert('ID', 'NAME').into('table1').values(
        sqb.raw('values (1,2)')
    );
    let result = query.generate();
    assert.equal(result.sql, 'insert into table1 (ID, NAME) values (1,2)');
    done();
  });

  it('should check arguments in .values()', function(done) {
    let ok;
    try {
      sqb.insert('id', 'name').into(sqb.raw('table1')).values(1);
    } catch (e) {
      ok = true;
    }
    assert.ok(ok);
    done();
  });

});