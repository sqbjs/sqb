/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('Serialize update query', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize UpdateQuery', function() {
    const q = sqb.update('table1', {id: 1});
    assert(q.isQuery && q.isUpdate);
  });

  it('should serialize update', function() {
    var query = sqb.update('table1', {id: 2, name: 'aaa'})
        .where(Op.eq('id', 1));
    var result = query.generate(options);
    assert.equal(result.sql, 'update table1 set id = 2, name = \'aaa\' where id = 1');
  });

  it('should pass raw as table name', function() {
    var query = sqb.update(sqb.raw('table1'), {id: 2, name: 'aaa'})
        .where(Op.eq('id', 1));
    var result = query.generate(options);
    assert.equal(result.sql, 'update table1 set id = 2, name = \'aaa\' where id = 1');
  });

  it('should validate first (tableName) argument', function() {
    try {
      sqb.update(null, {id: 1, name: 'aaa'});
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate second (values) argument', function() {
    try {
      sqb.update('table1', [1, 'aaa']);
    } catch (e) {
      try {
        sqb.update('table1', 'sdfds');
      } catch (e) {
        return;
      }
    }
    assert(0, 'Failed');
  });

  it('should serialize params with "values" argument: COLON', function() {
    var query = sqb.update('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.COLON
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'update table1 set id = :id, name = :name');
    assert.deepEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with "values" argument: QUESTION_MARK', function() {
    var query = sqb.update('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.QUESTION_MARK
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'update table1 set id = ?, name = ?');
    assert.deepEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: DOLLAR', function() {
    var query = sqb.update('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.DOLLAR
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'update table1 set id = $1, name = $2');
    assert.deepEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: AT', function() {
    var query = sqb.update('table1', {id: /id/, name: /name/});
    var result = query.generate(Object.assign({
      paramType: sqb.ParamType.AT
    }, options), {
      id: 1,
      name: 'abc'
    });
    assert.equal(result.sql, 'update table1 set id = @id, name = @name');
    assert.deepEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with query.params', function() {
    var query = sqb.update('table1', {id: /id/, name: /name/})
        .params({
          id: 1,
          name: 'abc'
        });
    var result = query.generate(options);
    assert.equal(result.sql, 'update table1 set id = :id, name = :name');
    assert.deepEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should validate query.params', function() {
    try {
      sqb.update('table1', {id: /id/, name: /name/})
          .params([1, 'abc']);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should serialize update with returning', function() {
    var query = sqb.update('table1', {id: 1, name: 'aaa'})
        .returning({'id': 'number', name: 'string'});
    var result = query.generate(options);
    assert.equal(result.sql, 'update table1 set id = 1, name = \'aaa\' returning id, name');
  });

  it('should validate returning() arguments', function() {
    try {
      sqb.update('table1', {id: 1, name: 'aaa'})
          .returning(1234);
    } catch (e) {
      sqb.update('table1', {id: 1, name: 'aaa'})
          .returning(null);
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate returning() data types', function() {
    try {
      sqb.update('table1', {id: 1, name: 'aaa'})
          .returning({id: 'invalid'});
    } catch (e) {
      sqb.update('table1', {id: 1, name: 'aaa'})
          .returning({id: 'string'});
      return;
    }
    assert(0, 'Failed');
  });

});