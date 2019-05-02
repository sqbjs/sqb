/* eslint-disable */
'use strict';
const assert = require('assert');
const sqb = require('../');
const Op = sqb.Op;

describe('serialize "Operators"', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  /*
   *
   */
  describe('and operator', function() {
    it('should initialize', function() {
      const op = Op.and();
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'and');
    });

    it('should skip empty items', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.and(null, undefined, 0, Op.eq('id', 1)));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id = 1)');
    });

    it('should validate items are Operator', function() {
      try {
        Op.and(new Date());
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.and(Op.eq('id', 1), Op.eq('id', 2)));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id = 1 and id = 2)');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({and: [{'id': 1}, {'id': 2}]}, {and: {'id': 3}});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id = 1 and id = 2) and (id = 3)');
    });

  });

  /*
   *
   */
  describe('or operator', function() {
    it('should initialize', function() {
      const op = Op.or();
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'or');
    });

    it('should skip empty items', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.or(null, undefined, 0, Op.eq('id', 1)));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id = 1)');
    });

    it('should validate items are Operator', function() {
      try {
        Op.or(new Date());
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.or(Op.and(Op.eq('id', 1), Op.eq('id', 2)), Op.eq('id', 3)));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where ((id = 1 and id = 2) or id = 3)');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({OR: [{'id': 1}, {'id': 2}]});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id = 1 or id = 2)');
    });

  });

  /*
   *
   */
  describe('eq (=) operator', function() {
    it('should initialize', function() {
      const op = Op.eq('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'eq');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id = 1');
    });

    it('should use Serializable as first arg', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq(sqb.raw('id'), 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id = 1');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      let result = query.generate(Object.assign({
        values: {id: 1}
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id = :id');
      assert.strictEqual(result.values.id, 1);
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a': 1, 'b=': 2, 'c =': 3});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a = 1 and b = 2 and c = 3');
    });
  });

  /*
   *
   */
  describe('ne (!=) operator', function() {
    it('should initialize', function() {
      const op = Op.ne('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'ne');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.ne('id', 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id != 1');
    });

    it('should use Serializable as first arg', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.ne(sqb.raw('id'), 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id != 1');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.ne('id', /id/));
      let result = query.generate(Object.assign({
        values: {id: 1}
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id != :id');
      assert.strictEqual(result.values.id, 1);
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a!=': 1, 'b !=': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a != 1 and b != 2');
    });
  });

  /*
   *
   */
  describe('gt (>) operator', function() {
    it('should initialize', function() {
      const op = Op.gt('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'gt');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.gt('id', 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id > 1');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a>': 1, 'b >': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a > 1 and b > 2');
    });

  });

  /*
   *
   */
  describe('lt (<) operator', function() {
    it('should initialize', function() {
      const op = Op.lt('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'lt');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.lt('id', 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id < 1');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a<': 1, 'b <': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a < 1 and b < 2');
    });
  });

  /*
   *
   */
  describe('gte (>=) operator', function() {
    it('should initialize', function() {
      const op = Op.gte('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'gte');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.gte('id', 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id >= 1');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a>=': 1, 'b >=': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a >= 1 and b >= 2');
    });

  });

  /*
   *
   */
  describe('lte (<=) operator', function() {
    it('should initialize', function() {
      const op = Op.lte('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'lte');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.lte('id', 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id <= 1');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a<=': 1, 'b <=': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a <= 1 and b <= 2');
    });

  });

  /*
   *
   */
  describe('between operator', function() {
    it('should initialize', function() {
      const op = Op.between('id', 1, 3);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'between');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.between('id', 10, 20));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id between 10 and 20');
    });

    it('should serialize with one arg', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.btw('id', 10));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id between 10 and 10');
    });

    it('should serialize with one array arg', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.between('id', [10, 20]));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id between 10 and 20');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.between('id', /id1/, /id2/));
      let result = query.generate(Object.assign({
        values: {
          id1: 1,
          id2: 5
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id between :id1 and :id2');
      assert.strictEqual(result.values.id1, 1);
      assert.strictEqual(result.values.id2, 5);
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a btw': [1, 2], 'b between': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a between 1 and 2 and b between 2 and 2');
    });

  });

  /*
   *
   */
  describe('notBetween operator', function() {
    it('should initialize', function() {
      const op = Op.notBetween('id', 1, 3);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'notBetween');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.notBetween('id', 10, 20));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id not between 10 and 20');
    });

    it('should serialize with one arg', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.nbtw('id', 10));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id not between 10 and 10');
    });

    it('should serialize with one array arg', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.notBetween('id', [10, 20]));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id not between 10 and 20');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.notBetween('id', /id1/, /id2/));
      let result = query.generate(Object.assign({
        values: {
          id1: 1,
          id2: 5
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id not between :id1 and :id2');
      assert.strictEqual(result.values.id1, 1);
      assert.strictEqual(result.values.id2, 5);
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a nbtw': [1, 2], 'b notBetween': 2});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a not between 1 and 2 and b not between 2 and 2');
    });

  });

  /*
   *
   */
  describe('like operator', function() {
    it('should initialize', function() {
      const op = Op.like('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'like');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.like('name', 'John\'s'), Op.like('id', 10));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where name like \'John\'\'s\'' +
          ' and id like \'10\'');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.like('name', /name/));
      let result = query.generate(Object.assign({
        values: {
          name: 'John'
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where name like :name');
      assert.strictEqual(result.values.name, 'John');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a like': '1'});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a like \'1\'');
    });

  });

  /*
   *
   */
  describe('notLike operator', function() {
    it('should initialize', function() {
      const op = Op.notLike('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'notLike');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.notLike('name', 'John\'s'), Op.notLike('id', 10));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where name not like \'John\'\'s\'' +
          ' and id not like \'10\'');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.nlike('name', /name/));
      let result = query.generate(Object.assign({
        values: {
          name: 'John'
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where name not like :name');
      assert.strictEqual(result.values.name, 'John');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a !like': '1'});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a not like \'1\'');
    });

  });

  /*
   *
   */
  describe('ilike operator', function() {
    it('should initialize', function() {
      const op = Op.ilike('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'ilike');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.ilike('name', 'John\'s'), Op.ilike('id', 10));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where name ilike \'John\'\'s\'' +
          ' and id ilike \'10\'');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.ilike('name', /name/));
      let result = query.generate(Object.assign({
        values: {
          name: 'John'
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where name ilike :name');
      assert.strictEqual(result.values.name, 'John');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a ilike': '1'});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a ilike \'1\'');
    });

  });

  /*
   *
   */
  describe('notILike operator', function() {
    it('should initialize', function() {
      const op = Op.notILike('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'notILike');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.nilike('name', 'John\'s'), Op.notILike('id', 10));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where name not ilike \'John\'\'s\'' +
          ' and id not ilike \'10\'');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.notILike('name', /name/));
      let result = query.generate(Object.assign({
        values: {
          name: 'John'
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where name not ilike :name');
      assert.strictEqual(result.values.name, 'John');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a !ilike': '1'});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a not ilike \'1\'');
    });
  });

  /*
   *
   */
  describe('in operator', function() {
    it('should initialize', function() {
      const op = Op.in('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'in');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.or(Op.in('id', 1), Op.in('id', [4, 5, 6])));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id in (1)' +
          ' or id in (4,5,6))');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.in('id', /id/));
      let result = query.generate(Object.assign({
        values: {
          id: [1, 2, 3]
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id in :id');
      assert.deepStrictEqual(result.values.id, [1, 2, 3]);
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a in': 1, 'b in': [1, 2]});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a in (1) and b in (1,2)');
    });

    it('should throw if value list is empty', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.or(Op.in('id', [])));
      assert.throws(() => {
        query.generate(options);
      }, /"in" operator does not allow empty list/);
    });

  });

  /*
 *
 */
  describe('notIn operator', function() {
    it('should initialize', function() {
      const op = Op.notIn('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'notIn');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.or(Op.notIn('id', 1), Op.notIn('id', [4, 5, 6])));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (id not in (1)' +
          ' or id not in (4,5,6))');
    });

    it('should serialize params', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.nin('id', /id/));
      let result = query.generate(Object.assign({
        values: {
          id: [1, 2, 3]
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id not in :id');
      assert.deepStrictEqual(result.values.id, [1, 2, 3]);
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a !in': 1, 'b !in': [1, 2]});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a not in (1) and b not in (1,2)');
    });

  });

  /*
   *
   */
  describe('is operator', function() {
    it('should initialize', function() {
      const op = Op.is('id', null);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'is');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.is('id', null));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id is null');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a.a is': null});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a.a is null');
    });

  });

  /*
   *
   */
  describe('not operator', function() {
    it('should initialize', function() {
      const op = Op.not('id', 1);
      assert(op instanceof sqb.Operator);
      assert.strictEqual(op.operatorType, 'not');
    });

    it('should serialize', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.not('id', null));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id is not null');
    });

    it('should wrap native objects to operators', function() {
      let query = sqb.select()
          .from('table1')
          .where({'a !is': null});
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where a is not null');
    });

  });

  /*
   *
   */
  describe('common', function() {

    it('should use sub-select as expression', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq(sqb.select('id').from('table'), 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where (select id from table) = 1');
    });

    it('should use raw as expression', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq(sqb.raw('id'), 1));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id = 1');
    });

    it('should use sub-select as value', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', sqb.select('id').from('table')));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id = (select id from table)');
    });

    it('should use raw as value', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', sqb.raw('1')));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where id = 1');
    });

    it('should use Date as value', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('dt1', new Date(2017, 0, 15, 10, 30, 0, 0)),
              Op.eq('dt2', new Date(2017, 10, 1, 8, 5, 50, 0)));
      let result = query.generate(options);
      assert.strictEqual(result.sql, 'select * from table1 where dt1 = \'2017-01-15 10:30:00\'' +
          ' and dt2 = \'2017-11-01 08:05:50\'');
    });

    it('should use null as params -  COLON', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      let result = query.generate(Object.assign({
        values: {
          id: null
        }
      }, options));
      assert.strictEqual(result.sql, 'select * from table1 where id = :id');
      assert.strictEqual(result.values.id, null);
    });

    it('should use null as params - QUESTION_MARK', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      let result = query.generate({
        paramType: 1,
        prettyPrint: 0,
        values: {
          id: null
        }
      });
      assert.strictEqual(result.sql, 'select * from table1 where id = ?');
      assert.strictEqual(result.values[0], null);
    });

    it('should use null as params - DOLLAR', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      let result = query.generate({
        paramType: 2,
        prettyPrint: 0,
        values: {
          id: null
        }
      });
      assert.strictEqual(result.sql, 'select * from table1 where id = $1');
      assert.strictEqual(result.values[0], null);
    });

    it('should use null as params - AT', function() {
      let query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      let result = query.generate({
        paramType: 3,
        prettyPrint: 0,
        values: {
          id: null
        }
      });
      assert.strictEqual(result.sql, 'select * from table1 where id = @id');
      assert.strictEqual(result.values.id, null);
    });

    it('should validate when wrapping native objects to operators', function() {
      try {
        sqb.select()
            .from('table1')
            .where({'#id=': 3});
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should validate when wrapping native objects to operators', function() {
      try {
        sqb.select()
            .from('table1')
            .where({'id non': 3});
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

  });

});
