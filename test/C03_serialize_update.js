/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('Serialize update query', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize UpdateQuery', function() {
    const q = sqb.update('table1', {id: 1});
    assert(q.isQuery && q.isUpdate);
  });

  it('should serialize update', function() {
    let query = sqb.update('table1', {id: 2, name: 'aaa'})
        .where(Op.eq('id', 1));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'update table1 set id = 2, name = \'aaa\' where id = 1');
  });

  it('should pass raw as table name', function() {
    let query = sqb.update(sqb.raw('table1'), {id: 2, name: 'aaa'})
        .where(Op.eq('id', 1));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'update table1 set id = 2, name = \'aaa\' where id = 1');
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
    let query = sqb.update('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.COLON,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'update table1 set id = :id, name = :name');
    assert.deepStrictEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with "values" argument: QUESTION_MARK', function() {
    let query = sqb.update('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.QUESTION_MARK,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'update table1 set id = ?, name = ?');
    assert.deepStrictEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: DOLLAR', function() {
    let query = sqb.update('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.DOLLAR,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'update table1 set id = $1, name = $2');
    assert.deepStrictEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: AT', function() {
    let query = sqb.update('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.AT,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'update table1 set id = @id, name = @name');
    assert.deepStrictEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with query.params', function() {
    let query = sqb.update('table1', {id: /id/, name: /name/})
        .values({
          id: 1,
          name: 'abc'
        });
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'update table1 set id = :id, name = :name');
    assert.deepStrictEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should validate query.params', function() {
    try {
      sqb.update('table1', {id: /id/, name: /name/})
          .values([1, 'abc']);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should serialize update with returning', function() {
    let query = sqb.update('table1', {id: 1, name: 'aaa'})
        .returning({'id': 'number', name: 'string'});
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'update table1 set id = 1, name = \'aaa\' returning id, name');
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
