/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert query', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize InsertQuery', function() {
    const q = sqb.insert('table1', {id: 1});
    assert(q.isQuery && q.isInsert);
  });

  it('should serialize insert', function() {
    var query = sqb.insert('table1', {id: 1, name: 'aaa'});
    var result = query.generate(options);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should serialize insert.into', function() {
    var query = sqb.insert('table1', {id: 1, name: 'aaa'});
    var result = query.generate(options);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should pass raw as table name', function() {
    var query = sqb.insert(sqb.raw('table1'), {id: 1, name: 'aaa'});
    var result = query.generate(options);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should validate first (tableName) argument', function() {
    try {
      sqb.insert(null, {id: 1, name: 'aaa'});
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate second (values) argument', function() {
    try {
      sqb.insert('table1', [1, 'aaa']);
    } catch (e) {
      try {
        sqb.insert('table1', 'sdfds');
      } catch (e) {
        return;
      }
    }
    assert(0, 'Failed');
  });

  it('should serialize params with "values" argument: COLON', function() {
    var query = sqb.insert('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.COLON
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with "values" argument: QUESTION_MARK', function() {
    var query = sqb.insert('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.QUESTION_MARK
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: DOLLAR', function() {
    var query = sqb.insert('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.DOLLAR
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'insert into table1 (id, name) values ($1, $2)');
    assert.deepEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: AT', function() {
    var query = sqb.insert('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.AT
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'insert into table1 (id, name) values (@id, @name)');
    assert.deepEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with query.params', function() {
    var query = sqb.insert('table1', {id: /id/, name: /name/})
        .params({
          id: 1,
          name: 'abc'
        });
    var result = query.generate(options);
    assert.equal(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should validate query.params', function() {
    try {
      sqb.insert('table1', {id: /id/, name: /name/})
          .params([1, 'abc']);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should serialize insert/select query', function() {
    var query = sqb.insert('table1',
        sqb.select('id', 'the_name name').from('table2'));
    var result = query.generate(options);
    assert.equal(result.sql, 'insert into table1 (id, name) values (select id, the_name name from table2)');
  });

  it('should serialize insert with returning', function() {
    var query = sqb.insert('table1', {id: 1, name: 'aaa'})
        .returning({'sch1.tbl1.id': 'number', 'update u1': 'string'});
    var result = query.generate(options);
    assert.equal(result.sql, 'insert into table1 (id, name) values (1, \'aaa\') returning sch1.tbl1.id, "update" u1');
  });

  it('should validate returning() arguments', function() {
    sqb.insert('table1', {id: 1, name: 'aaa'})
        .returning(null);
    try {
      sqb.insert('table1', {id: 1, name: 'aaa'})
          .returning(1234);
    } catch (e) {
      try {
        sqb.insert('table1', {id: 1, name: 'aaa'})
            .returning({'123': 'string'});
      } catch (e) {
        return;
      }
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate returning() data types', function() {
    try {
      sqb.insert('table1', {id: 1, name: 'aaa'})
          .returning({id: 'invalid'});
    } catch (e) {
      sqb.insert('table1', {id: 1, name: 'aaa'})
          .returning({id: 'string'});
      return;
    }
    assert(0, 'Failed');
  });

});