/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('serialize "Operators"', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  /*
   *
   */
  describe('and operator', function() {
    it('should initialize', function() {
      const op = Op.and();
      assert(op.isOperator);
      assert.equal(op.operatorType, 'and');
    });

    it('should skip empty items', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.and(null, undefined, 0, Op.eq('id', 1)));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where (id = 1)');
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
      var query = sqb.select()
          .from('table1')
          .where(Op.and(Op.eq('id', 1), Op.eq('id', 2)));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where (id = 1 and id = 2)');
    });
  });

  /*
   *
   */
  describe('or operator', function() {
    it('should initialize', function() {
      const op = Op.or();
      assert(op.isOperator);
      assert.equal(op.operatorType, 'or');
    });

    it('should skip empty items', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.or(null, undefined, 0, Op.eq('id', 1)));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where (id = 1)');
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
      var query = sqb.select()
          .from('table1')
          .where(Op.or(Op.and(Op.eq('id', 1), Op.eq('id', 2)), Op.eq('id', 3)));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where ((id = 1 and id = 2) or id = 3)');
    });

  });

  /*
   *
   */
  describe('eq (=) operator', function() {
    it('should initialize', function() {
      const op = Op.eq('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'eq');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id = 1');
    });

    it('should use Serializable as first arg', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq(sqb.raw('id'), 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id = 1');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      var result = query.generate(options, {
        id: 1
      });
      assert.equal(result.sql, 'select * from table1 where id = :id');
      assert.equal(result.values.id, 1);
    });
  });

  /*
   *
   */
  describe('ne (not =) operator', function() {
    it('should initialize', function() {
      const op = Op.ne('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'ne');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.ne('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id not = 1');
    });

    it('should use Serializable as first arg', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.ne(sqb.raw('id'), 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id not = 1');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.ne('id', /id/));
      var result = query.generate(options, {
        id: 1
      });
      assert.equal(result.sql, 'select * from table1 where id not = :id');
      assert.equal(result.values.id, 1);
    });
  });

  /*
   *
   */
  describe('gt (>) operator', function() {
    it('should initialize', function() {
      const op = Op.gt('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'gt');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.gt('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id > 1');
    });
  });

  /*
   *
   */
  describe('lt (<) operator', function() {
    it('should initialize', function() {
      const op = Op.lt('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'lt');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.lt('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id < 1');
    });
  });

  /*
   *
   */
  describe('gte (>=) operator', function() {
    it('should initialize', function() {
      const op = Op.gte('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'gte');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.gte('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id >= 1');
    });
  });

  /*
   *
   */
  describe('lte (<=) operator', function() {
    it('should initialize', function() {
      const op = Op.lte('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'lte');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.lte('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id <= 1');
    });
  });

  /*
   *
   */
  describe('lte (<=) operator', function() {
    it('should initialize', function() {
      const op = Op.lte('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'lte');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.lte('id', 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id <= 1');
    });
  });

  /*
   *
   */
  describe('between operator', function() {
    it('should initialize', function() {
      const op = Op.between('id', 1, 3);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'between');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.between('id', 10, 20));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id between 10 and 20');
    });

    it('should serialize with one arg', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.between('id', 10));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id between 10 and 10');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.between('id', /id1/, /id2/));
      var result = query.generate(options, {
        id1: 1,
        id2: 5
      });
      assert.equal(result.sql, 'select * from table1 where id between :id1 and :id2');
      assert.equal(result.values.id1, 1);
      assert.equal(result.values.id2, 5);
    });

    /*
     *
     */
    describe('notBetween operator', function() {
      it('should initialize', function() {
        const op = Op.notBetween('id', 1, 3);
        assert(op.isOperator);
        assert.equal(op.operatorType, 'notBetween');
      });

      it('should serialize', function() {
        var query = sqb.select()
            .from('table1')
            .where(Op.notBetween('id', 10, 20));
        var result = query.generate(options);
        assert.equal(result.sql, 'select * from table1 where id not between 10 and 20');
      });

      it('should serialize with one arg', function() {
        var query = sqb.select()
            .from('table1')
            .where(Op.notBetween('id', 10));
        var result = query.generate(options);
        assert.equal(result.sql, 'select * from table1 where id not between 10 and 10');
      });

      it('should serialize params', function() {
        var query = sqb.select()
            .from('table1')
            .where(Op.notBetween('id', /id1/, /id2/));
        var result = query.generate(options, {
          id1: 1,
          id2: 5
        });
        assert.equal(result.sql, 'select * from table1 where id not between :id1 and :id2');
        assert.equal(result.values.id1, 1);
        assert.equal(result.values.id2, 5);
      });
    });
  });

  /*
   *
   */
  describe('like operator', function() {
    it('should initialize', function() {
      const op = Op.like('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'like');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.like('name', 'John\'s'), Op.like('id', 10));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where name like \'John\'\'s\'' +
          ' and id like \'10\'');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.like('name', /name/));
      var result = query.generate(options, {
        name: 'John'
      });
      assert.equal(result.sql, 'select * from table1 where name like :name');
      assert.equal(result.values.name, 'John');
    });
  });

  /*
   *
   */
  describe('notLike operator', function() {
    it('should initialize', function() {
      const op = Op.notLike('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'notLike');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.notLike('name', 'John\'s'), Op.notLike('id', 10));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where name not like \'John\'\'s\'' +
          ' and id not like \'10\'');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.notLike('name', /name/));
      var result = query.generate(options, {
        name: 'John'
      });
      assert.equal(result.sql, 'select * from table1 where name not like :name');
      assert.equal(result.values.name, 'John');
    });
  });

  /*
   *
   */
  describe('ilike operator', function() {
    it('should initialize', function() {
      const op = Op.ilike('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'ilike');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.ilike('name', 'John\'s'), Op.ilike('id', 10));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where name ilike \'John\'\'s\'' +
          ' and id ilike \'10\'');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.ilike('name', /name/));
      var result = query.generate(options, {
        name: 'John'
      });
      assert.equal(result.sql, 'select * from table1 where name ilike :name');
      assert.equal(result.values.name, 'John');
    });
  });

  /*
   *
   */
  describe('notILike operator', function() {
    it('should initialize', function() {
      const op = Op.notILike('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'notILike');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.notILike('name', 'John\'s'), Op.notILike('id', 10));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where name not ilike \'John\'\'s\'' +
          ' and id not ilike \'10\'');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.notILike('name', /name/));
      var result = query.generate(options, {
        name: 'John'
      });
      assert.equal(result.sql, 'select * from table1 where name not ilike :name');
      assert.equal(result.values.name, 'John');
    });
  });

  /*
   *
   */
  describe('in operator', function() {
    it('should initialize', function() {
      const op = Op.in('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'in');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.or(Op.in('id', 1), Op.in('id', [4, 5, 6])));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where (id in (1)' +
          ' or id in (4,5,6))');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.in('id', /id/));
      var result = query.generate(options, {
        id: [1, 2, 3]
      });
      assert.equal(result.sql, 'select * from table1 where id in :id');
      assert.deepEqual(result.values.id, [1, 2, 3]);
    });
  });

  /*
 *
 */
  describe('notIn operator', function() {
    it('should initialize', function() {
      const op = Op.notIn('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'notIn');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.or(Op.notIn('id', 1), Op.notIn('id', [4, 5, 6])));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where (id not in (1)' +
          ' or id not in (4,5,6))');
    });

    it('should serialize params', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.notIn('id', /id/));
      var result = query.generate(options, {
        id: [1, 2, 3]
      });
      assert.equal(result.sql, 'select * from table1 where id not in :id');
      assert.deepEqual(result.values.id, [1, 2, 3]);
    });
  });

  /*
   *
   */
  describe('is operator', function() {
    it('should initialize', function() {
      const op = Op.is('id', null);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'is');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.is('id', null));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id is null');
    });
  });

  /*
   *
   */
  describe('not operator', function() {
    it('should initialize', function() {
      const op = Op.not('id', 1);
      assert(op.isOperator);
      assert.equal(op.operatorType, 'not');
    });

    it('should serialize', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.not('id', null));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id is not null');
    });
  });

  /*
   *
   */
  describe('common', function() {

    it('should use sub-select as expression', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq(sqb.select('id').from('table'), 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where (select id from table) = 1');
    });

    it('should use raw as expression', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq(sqb.raw('id'), 1));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id = 1');
    });

    it('should use sub-select as value', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', sqb.select('id').from('table')));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id = (select id from table)');
    });

    it('should use raw as value', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', sqb.raw('1')));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where id = 1');
    });

    it('should use Date as value', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('dt1', new Date(2017, 0, 15, 10, 30, 0, 0)),
              Op.eq('dt2', new Date(2017, 10, 1, 8, 5, 50, 0)));
      var result = query.generate(options);
      assert.equal(result.sql, 'select * from table1 where dt1 = \'2017-01-15 10:30:00\'' +
          ' and dt2 = \'2017-11-01 08:05:50\'');
    });

    it('should user null as params -  COLON', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      var result = query.generate(options, {
        id: null
      });
      assert.equal(result.sql, 'select * from table1 where id = :id');
      assert.equal(result.values.id, null);
    });

    it('should user null as params - QUESTION_MARK', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      var result = query.generate({
        paramType: 1,
        prettyPrint: 0
      }, {
        id: null
      });
      assert.equal(result.sql, 'select * from table1 where id = ?');
      assert.equal(result.values[0], null);
    });

    it('should user null as params - DOLLAR', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      var result = query.generate({
        paramType: 2,
        prettyPrint: 0
      }, {
        id: null
      });
      assert.equal(result.sql, 'select * from table1 where id = $1');
      assert.equal(result.values[0], null);
    });

    it('should user null as params - AT', function() {
      var query = sqb.select()
          .from('table1')
          .where(Op.eq('id', /id/));
      var result = query.generate({
        paramType: 3,
        prettyPrint: 0
      }, {
        id: null
      });
      assert.equal(result.sql, 'select * from table1 where id = @id');
      assert.equal(result.values.id, null);
    });

  });

});
