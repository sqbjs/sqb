/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Initialize sql objects sqb.js', function() {

  it('should create serializer', function() {
    var obj = sqb.serializer();
    assert.ok(obj instanceof sqb.Serializer);
  });

  it('should initialize "raw"', function() {
    var obj = sqb.raw('test');
    assert.ok(obj instanceof sqb.Raw);
    assert.equal(obj.type, 'raw');
  });

  it('should initialize "select"', function() {
    var obj = sqb.select('id');
    assert.ok(obj instanceof sqb.SelectQuery);
    assert.equal(obj.type, 'select');
  });

  it('should initialize "join"', function() {
    var obj = sqb.join('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.INNER, obj.joinType);
  });

  it('should validate arguments in "join"', function() {
    try {
      new sqb.Join(sqb.JoinType.INNER, 1);
      new sqb.Join(-1, 'table');
      new sqb.Join(7, 'table');
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should not initialize invalid "join"', function() {
    try {
      sqb.join(new sqb.Join(8));
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should initialize "innerJoin"', function() {
    var obj = sqb.innerJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.INNER, obj.joinType);
  });

  it('should initialize "leftJoin"', function() {
    var obj = sqb.leftJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.LEFT, obj.joinType);
  });

  it('should initialize "leftOuterJoin"', function() {
    var obj = sqb.leftOuterJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.LEFT_OUTER, obj.joinType);
  });

  it('should initialize "rightJoin"', function() {
    var obj = sqb.rightJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.RIGHT, obj.joinType);
  });

  it('should initialize "rightOuterJoin"', function() {
    var obj = sqb.rightOuterJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.RIGHT_OUTER, obj.joinType);
  });

  it('should initialize "outerJoin"', function() {
    var obj = sqb.outerJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.OUTER, obj.joinType);
  });

  it('should initialize "fullOuterJoin"', function() {
    var obj = sqb.fullOuterJoin('table');
    assert.ok(obj instanceof sqb.Join);
    assert.equal(obj.type, 'join');
    assert.equal(sqb.JoinType.FULL_OUTER, obj.joinType);
  });

  it('should set action/clientId/module of query', function() {
    var obj = sqb.select('id').action('123').clientId('5').module('abc');
    assert.equal(obj._action, 123);
    assert.equal(obj._clientId, 5);
    assert.equal(obj._module, 'abc');
  });

  describe('Select query', function() {

    it('should "type" member must be "select"', function() {
      var obj = sqb.select().where().groupBy().orderBy();
      assert.equal(obj.type, 'select');
      assert.equal(obj.isSelect, true);
    });

    it('should define columns with string', function() {
      var obj = sqb.select('col1', 'col2 c2', 'tbl.col3 c3');
      assert.equal(obj._columns.length, 3);
      assert.equal(obj._columns[0].type === 'column', true);
      assert.equal(obj._columns[0].field, 'col1');
      assert.equal(obj._columns[1].field, 'col2');
      assert.equal(obj._columns[1].alias, 'c2');
      assert.equal(obj._columns[2].table, 'tbl');
      assert.equal(obj._columns[2].field, 'col3');
      assert.equal(obj._columns[2].alias, 'c3');
    });

    it('should define table in "from"', function() {
      var obj = sqb.select().from('table1', 'table2');
      assert.equal(obj._tables.length, 2);
      assert.equal(obj._tables[0].table, 'table1');
      assert.equal(obj._tables[1].table, 'table2');

      obj = sqb.select().from('sch.table1 t1');
      assert.equal(obj._tables[0].schema, 'sch');
      assert.equal(obj._tables[0].table, 'table1');
      assert.equal(obj._tables[0].alias, 't1');
    });

    it('should define "join"', function() {
      var obj = sqb.select().join(sqb.join('table1'));
      assert.equal(obj._joins.length, 1);
      assert.ok(obj._joins[0] instanceof sqb.Join);
      assert.equal(obj._joins[0].table.table, 'table1');
    });

    it('should define "where"', function() {
      var obj = sqb.select().where(['ID', 1]);
      assert.equal(obj._where.length, 1);
      assert.ok(obj._where.item(0) instanceof sqb.Condition);
      assert.equal(obj._where.item(0).field, 'ID');
    });

    it('should validate arguments in "where"', function() {
      try {
        sqb.select().where(1);
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should validate arguments in "condition"', function() {
      try {
        sqb.select().where(sqb.and());
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should validate operator in "condition"', function() {
      try {
        sqb.select().where(sqb.and('id', '-', 1));
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should validate arguments in "joing"', function() {
      try {
        sqb.select().join(1);
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

    it('should define "order by"', function() {
      var obj = sqb.select('ID').orderBy('t1.field1', 'field2 desc');
      assert.equal(obj._orderby.length, 2);
      assert.equal(obj._orderby[0].table, 't1');
      assert.equal(obj._orderby[0].field, 'field1');
      assert.equal(obj._orderby[1].field, 'field2');
      assert.equal(obj._orderby[1].descending, true);
    });

    it('should define "alias"', function() {
      var obj = sqb.select().as('t1');
      assert.equal(obj._alias, 't1');
    });

    it('should define "limit"', function() {
      var obj = sqb.select().limit(5);
      assert.equal(obj._limit, 5);
    });

    it('should define "offset"', function() {
      var obj = sqb.select().offset(10);
      assert.equal(obj._offset, 10);
    });

    it('should not execute', function() {
      try {
        sqb.select().execute();
      } catch (e) {
        return;
      }
      assert(0, 'Failed');
    });

  });

});