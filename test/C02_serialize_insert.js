/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert query', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize InsertQuery', function() {
    const q = sqb.insert('table1', {id: 1});
    assert(q.isQuery && q.isInsert);
  });

  it('should serialize insert', function() {
    let query = sqb.insert('table1', {id: 1, name: 'aaa'});
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should serialize insert.into', function() {
    let query = sqb.insert('table1', {id: 1, name: 'aaa'});
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
  });

  it('should pass raw as table name', function() {
    let query = sqb.insert(sqb.raw('table1'), {id: 1, name: 'aaa'});
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
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
    let query = sqb.insert('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.COLON,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepStrictEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with "values" argument: QUESTION_MARK', function() {
    let query = sqb.insert('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.QUESTION_MARK,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (?, ?)');
    assert.deepStrictEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: DOLLAR', function() {
    let query = sqb.insert('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.DOLLAR,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values ($1, $2)');
    assert.deepStrictEqual(result.values, [1, 'abc']);
  });

  it('should serialize params with "values" argument: AT', function() {
    let query = sqb.insert('table1', {id: /id/, name: /name/});
    let result = query.generate(Object.assign({
      paramType: sqb.ParamType.AT,
      values: {
        id: 1,
        name: 'abc'
      }
    }, options));
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (@id, @name)');
    assert.deepStrictEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should serialize params with query.params', function() {
    let query = sqb.insert('table1', {id: /id/, name: /name/})
        .values({
          id: 1,
          name: 'abc'
        });
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (:id, :name)');
    assert.deepStrictEqual(result.values, {
      id: 1,
      name: 'abc'
    });
  });

  it('should validate query.params', function() {
    try {
      sqb.insert('table1', {id: /id/, name: /name/})
          .values([1, 'abc']);
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should serialize insert/select query', function() {
    let query = sqb.insert('table1',
        sqb.select('id', 'the_name name').from('table2'));
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (select id, the_name name from table2)');
  });

  it('should serialize insert with returning', function() {
    let query = sqb.insert('table1', {id: 1, name: 'aaa'})
        .returning({'sch1.tbl1.id': 'number', 'update u1': 'string'});
    let result = query.generate(options);
    assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\') returning sch1.tbl1.id, "update" u1');
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
