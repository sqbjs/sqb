/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize SelectQuery', function() {

  var serializer;

  before(function() {
    serializer = new sqb.serializer({
      dialect: 'test',
      prettyPrint: false
    });
  });

  describe('Serialize "select/from" part', function() {

    it('should serialize * for when no columns given', function() {
      var query = sqb.select('*').columns().from('table1').join();
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select * from table1');
    });

    it('should serialize when no tables given', function() {
      var query = sqb.select();
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select *');
    });

    it('should serialize simple query', function() {
      var query = sqb.select('field1', 'field2', 'field3',
          'field4', 'field5', 'field6', 'field7', 'field8', 'field9',
          'field10').from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1, field2, field3, field4, field5, ' +
          'field6, field7, field8, field9, field10 from table1');
    });

    it('should serialize schema and table alias in "from" part', function() {
      var query = sqb.select('t1.field1 f1').from('schema1.table1 t1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select t1.field1 f1 from schema1.table1 t1');
    });

    it('should serialize alias in columns', function() {
      var query = sqb.select('field1 f1', 'field2 as f2')
          .from('schema1.table1 t1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 f1, field2 f2 from schema1.table1 t1');
    });

    it('should serialize raw in columns', function() {
      var query = sqb.select(sqb.raw('\'John\'\'s Bike\' f1'))
          .from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select \'John\'\'s Bike\' f1 from table1');
    });

    it('should serialize sub-select in columns', function() {
      var query = sqb.select(sqb.select('id').from('table2').as('id2'))
          .from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select (select id from table2) id2 from table1');
    });

    it('should serialize raw in "from" part', function() {
      var query = sqb.select().from('table1', sqb.raw('func1()'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select * from table1, func1()');
    });

    it('should skip empty columns, tables, joins, group columns and order columns', function() {
      var query = sqb.select('field1', '')
          .from('schema1.table1 t1', '')
          .join(null)
          .groupBy('')
          .orderBy('');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from schema1.table1 t1');
    });

    it('should serialize sub-select in "from" part', function() {
      var query = sqb.select()
          .from(sqb.select('field1', 'field2', 'field3',
              'field4', 'field5', 'field6', 'field7', 'field8').from('table1')
              .as('t1'));
      var result = query.generate();
      assert.equal(result.sql,
          'select *\n' +
          'from (\n' +
          '  select\n' +
          '    field1, field2, field3, field4, field5, field6, field7, field8\n' +
          '  from table1) t1');
    });

    it('should validate field name', function() {
      var ok;
      try {
        sqb.select('a..b').from();
      } catch (e) {
        ok = true;
      }
      assert.ok(ok);
    });

    it('should validate table name', function() {
      var ok;
      try {
        sqb.select().from('table1"');
      } catch (e) {
        ok = true;
      }
      assert.ok(ok);
    });

    it('should pretty print', function() {
      var query = sqb.select()
          .from('table1')
          .where(['ID', 1], ['name', 'value of the field should be too long'],
              ['ID', 1], ['ID', 12345678])
          .groupBy('field1', 'field2', sqb.raw('field3'));
      var result = query.generate();
      assert.equal(result.sql, 'select * from table1\n' +
          'where ID = 1 and name = \'value of the field should be too long\' and\n' +
          '  ID = 1 and ID = 12345678\n' +
          'group by field1, field2, field3');
    });

  });

  describe('serialize "join" part', function() {

    it('should serialize join', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.join('join1'))
          .join(sqb.join('join2'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 inner join join1 inner join join2');
    });

    it('should serialize innerJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.innerJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 inner join join1');
    });

    it('should serialize leftJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.leftJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 left join join1');
    });

    it('should serialize leftOuterJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.leftOuterJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 left outer join join1');
    });

    it('should serialize rightJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.rightJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 right join join1');
    });

    it('should serialize rightOuterJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.rightOuterJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 right outer join join1');
    });

    it('should serialize outerJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.outerJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 outer join join1');
    });

    it('should serialize fullOuterJoin', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.fullOuterJoin('join1'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1 full outer join join1');
    });

    it('should serialize sub-select in join', function() {
      var query = sqb.select('field1').from('table1')
          .join(sqb.join(sqb.select().from('table2')))
          .join(sqb.join(sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6')
              .from('table4')));
      var result = query.generate();
      assert.equal(result.sql,
          'select field1 from table1\n' +
          'inner join (select * from table2)\n' +
          'inner join (\n' +
          '  select field1, field2, field3, field4, field5, field6 from table4)');
    });

    it('should serialize wrong Join', function() {
      var ok;
      try {
        sqb.select('field1').from('table1')
            .join(1);
      } catch (e) {
        ok = true;
      }
      assert.ok(ok);
    });

    it('should serialize raw in columns', function() {
      var query = sqb.select(sqb.raw('"hello"')).from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select "hello" from table1');
    });

    it('should not serialize raw in columns if empty', function() {
      var query = sqb.select('field1', sqb.raw('')).from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select field1 from table1');
    });

    it('should serialize raw in "from"', function() {
      var query = sqb.select().from(sqb.raw('"hello"'));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select * from "hello"');
    });

    it('should not serialize raw in "from" if empty', function() {
      var query = sqb.select().from(sqb.raw(''));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select *');
    });

    it('should serialize raw in "join"', function() {
      var query = sqb.select()
          .from('table1')
          .join(sqb.join(sqb.raw('"hello"')));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select * from table1 inner join "hello"');
    });

    it('should serialize join/on', function() {
      var query = sqb.select().from('table1')
          .join(sqb.innerJoin('join1').on(['ID', 1]));
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select * from table1 inner join join1 on ID = 1');
    });

  });

  describe('serialize "case" expressions', function() {

    it('should serialize single condition in "when"', function() {
      var query = sqb.select(
          sqb.case().when('age', '>=', 16).then(1).else(0)
      ).from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select case when age >= 16 then 1 else 0 end from table1');
    });

    it('should serialize without condition in "when"', function() {
      var query = sqb.select(
          sqb.case().when().then(1).else(100)
      ).from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select * from table1');
    });

    it('should serialize group of conditions in "when"', function() {
      var query = sqb.select(
          sqb.case().when(['col1', 5], 'or', ['col2', 4]).then(1).else(100)
      ).from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select case when col1 = 5 or col2 = 4 then 1 else 100 end from table1');
    });

    it('should serialize alias', function() {
      var query = sqb.select(
          sqb.case().when('col1', 5).then(1).else(100).as('col1')
      ).from('table1');
      var result = serializer.generate(query);
      assert.equal(result.sql, 'select case when col1 = 5 then 1 else 100 end col1 from table1');
    });

  });

  describe('Serialize "where" part', function() {

    describe('Serialize comparison operators', function() {

      it('should serialize "=" operator for field/value pair', function() {
        var query = sqb.select().from('table1').where(['ID', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = 1');
      });

      it('should serialize "=" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '=', '1']);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = \'1\'');
      });

      it('should serialize ">" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '>', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID > 1');
      });

      it('should serialize ">=" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '>=', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID >= 1');
      });

      it('should serialize "!>" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '!>', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID !> 1');
      });

      it('should serialize "<" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '<', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID < 1');
      });

      it('should serialize "<=" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '<=', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID <= 1');
      });

      it('should serialize "!<" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '!<', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID !< 1');
      });

      it('should serialize "!=" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '!=', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID != 1');
      });

      it('should serialize "<>" operator', function() {
        var query = sqb.select().from('table1').where(['ID', '<>', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID <> 1');
      });

      it('should serialize "is" operator', function() {
        var query = sqb.select().from('table1').where(['ID', 'is', null]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID is null');
      });

      it('should serialize "like" operator', function() {
        var query = sqb.select()
            .from('table1')
            .where(['NAME', 'like', '%abc%']);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where NAME like \'%abc%\'');
      });

      it('should ignore empty groups', function() {
        var query = sqb.select().from('table1').where(['ID', 1], []);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = 1');
      });

      it('should not serialize with invalid operator', function() {
        var ok;
        try {
          sqb.select()
              .from('table1')
              .where(['NAME', '>>', '%abc%']);
        } catch (e) {
          ok = 1;
        }
        assert.ok(ok);
      });

      it('should ignore empty group arguments', function() {
        sqb.select()
            .from('table1')
            .where(['id', 1], null);
      });

      it('should not serialize with invalid field object', function() {
        var ok;
        try {
          sqb.select()
              .from('table1')
              .where([{}, '=', '%abc%']);
        } catch (e) {
          ok = 1;
        }
        assert.ok(ok);
      });

      it('should serialize "between" operator', function() {
        var query = sqb.select()
            .from('table1')
            .where(['id', 'between', [1, 4]]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where id between 1 and 4');
      });

      it('should serialize "between" operator test2', function() {
        var query = sqb.select()
            .from('table1')
            .where(['id', '!between', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where id not between 1 and 1');
      });

      it('should serialize sub group', function() {
        var query = sqb.select().from('table1').where(['ID', 'is', null],
            [
              ['ID2', 1], 'or', ['ID2', 2]
            ]
        );
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID is null and (ID2 = 1 or ID2 = 2)');
      });

      it('should serialize wrong sub group', function() {
        var ok;
        try {
          sqb.select().from('table1').where(['ID', 'is', null],
              [
                [2, 1], 'orr', [2, 2]
              ]
          );
        } catch (e) {
          ok = 1;
        }
        assert.ok(ok);
      });

      it('should serialize raw in where test1', function() {
        var query = sqb.select().from('table1').where(sqb.raw('id = 1'));
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where id = 1');
      });

      it('should serialize raw in "where" test2', function() {
        var query = sqb.select().from('table1').where([[sqb.raw('ID')]]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where (ID = null)');
      });

      it('should use double quotes for reserved words test1', function() {
        var query = sqb.select().from('table1').where(['select', 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where "select" = 1');
      });

      it('should serialize raw', function() {
        var query = sqb.select('field1', sqb.raw('')).from('table1');
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select field1 from table1');
      });

      it('should serialize sub-select in condition', function() {
        var query = sqb.select().from('table1')
            .where(['ID', sqb.select('id').from('table2')]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID in (select id from table2)');
      });

      it('should serialize "case" in condition', function() {
        var query = sqb.select().from('table1')
            .where(['ID', sqb.case().when('col1', 5).then().else(100)]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID in (case when col1 = 5 then null else 100 end)');
      });

    });

    describe('Serialize values', function() {

      it('should serialize string', function() {
        var query = sqb.select().from('table1').where(['ID', 'abcd']);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = \'abcd\'');
      });

      it('should serialize number', function() {
        var query = sqb.select().from('table1').where(['ID', 123]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = 123');
      });

      it('should serialize date', function() {
        var query = sqb.select()
            .from('table1')
            .where(['ID', new Date(2017, 0, 1, 10, 30, 15)]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = \'2017-01-01 10:30:15\'');
      });

      it('should serialize array', function() {
        var query = sqb.select().from('table1').where(['ID', [1, 2, 3]]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID in (1,2,3)');

        query = sqb.select().from('table1').where(['ID', '!=', [1, 2, 3]]);
        result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID not in (1,2,3)');
      });

      it('should serialize null', function() {
        var query = sqb.select().from('table1').where(['ID', null]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = null');
      });

      it('should serialize raw', function() {
        var query = sqb.select()
            .from('table1')
            .where(['ID', sqb.raw('current_date')]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = current_date');
      });

      it('should set parameter values with generate()', function() {
        var query = sqb.select().from('table1').where(['ID', /ID/]);
        var result = query.generate(undefined, {ID: 1});
        assert.equal(result.sql, 'select * from table1 where ID = :ID');
        assert.equal(result.values.ID, 1);
      });

      it('should set parameter values with query.params()', function() {
        var query = sqb.select()
            .from('table1')
            .where(['ID', /ID/])
            .params({ID: 1});
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = :ID');
        assert.equal(result.values.ID, 1);
      });

      it('should not pass invalid parameter object to query.params()', function() {
        try {
          var query = sqb.select()
              .from('table1')
              .where(['ID', /ID/])
              .params(1234);
          var result = serializer.generate(query);
          assert.equal(result.sql, 'select * from table1 where ID = :ID');
          assert.equal(result.values.ID, 1);
        } catch (e) {
          return;
        }
        assert(0, 'Failed');
      });

      it('should serialize parameter', function() {
        var query = sqb.select().from('table1').where(['ID', /ID/]);
        var result = query.generate(undefined, {ID: 1});
        assert.equal(result.sql, 'select * from table1 where ID = :ID');
        assert.equal(result.values.ID, 1);
      });

      it('should serialize parameter for "between"', function() {
        const d1 = new Date();
        const d2 = new Date();
        const serializer = sqb.serializer({
              paramType: sqb.ParamType.QUESTION_MARK,
              prettyPrint: false
            }),
            query = sqb.select().from('table1').where(
                ['adate', 'between', /ADATE/],
                ['bdate', 'not between', /BDATE/]
            );
        var result = query.generate({
          paramType: sqb.ParamType.QUESTION_MARK,
          prettyPrint: false
        }, {
          ADATE: [d1, d2],
          BDATE: d1
        });
        assert.equal(result.sql, 'select * from table1 where adate between ? and ? and bdate not between ? and ?');
        assert.deepEqual(result.values, [d1, d2, d1, d1]);
        query.params({
          ADATE: [d1, d2],
          BDATE: d1
        });
        result = query.generate({
          paramType: sqb.ParamType.COLON,
          prettyPrint: false
        });
        assert.equal(result.sql, 'select * from table1 where adate between :ADATE1 and :ADATE2 and bdate not between :BDATE1 and :BDATE2');
        assert.deepEqual(result.values.ADATE1, d1);
        assert.deepEqual(result.values.ADATE2, d2);
        assert.deepEqual(result.values.BDATE1, d1);
        assert.deepEqual(result.values.BDATE2, d1);
      });

      it('should validate generate{params} argument', function() {
        var serializer = sqb.serializer();
        var ok = 0;
        try {
          serializer.generate(undefined, 123);
        } catch (e) {
          ok++;
        }
        try {
          serializer.generate(sqb.select(), 123);
        } catch (e) {
          ok++;
        }
        assert.equal(ok, 2);
      });

      it('should serialize strictParams', function() {
        var query = sqb.select().from('table1').where(['ID', 'abcd']);
        var result = query.generate({strictParams: true});
        assert.equal(result.sql, 'select * from table1 where ID = :generated_parameter_0');
        assert.equal(result.values.generated_parameter_0, 'abcd');
      });

      it('should pass array value for "like" operator', function() {
        var query = sqb.select().from('table1')
            .where(['ID', 'abcd'],
                ['ID2', 'like', ['a', 'b']],
                ['ID3', '!like', ['a', 'b']]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where ID = \'abcd\' and (ID2 like \'a\' or ID2 like \'b\') and (ID3 not like \'a\' or ID3 not like \'b\')');
      });

    });

    describe('Serialize "order by" part', function() {

      it('should serialize (fieldname)', function() {
        var query = sqb.select()
            .from('table1')
            .orderBy('field1', '-field2');
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 order by field1, field2 desc');
      });

      it('should serialize (fieldname)', function() {
        var query = sqb.select()
            .from('table1')
            .orderBy('field1', 'field2 descending', sqb.raw('field3'), sqb.raw(''));
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 order by field1, field2 desc, field3');
      });

      it('should validate order by', function() {
        var ok;
        try {
          sqb.select().from().orderBy('field2 dsss');
        } catch (e) {
          ok = true;
        }
        assert.ok(ok);
      });

    });

    describe('Sub-selects', function() {

      it('should serialize sub-select in "columns" part', function() {
        var query = sqb.select(sqb.select('ID').from('table2').as('and'))
            .from('table1');
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select (select ID from table2) "and" from table1');
        query = sqb.select(sqb.select('ID').from('table2')).from('table1');
        result = serializer.generate(query);
        assert.equal(result.sql, 'select (select ID from table2) from table1');
      });

      it('should serialize sub-select in "from" part', function() {
        var query = sqb.select().from(sqb.select().from('table1').as('t1'));
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from (select * from table1) t1');
      });

      it('should serialize sub-select in "join" part', function() {
        var query = sqb.select()
            .from('table1')
            .join(sqb.innerJoin(sqb.select().from('table1').as('t1')));
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 inner join (select * from table1) t1');
      });

      it('should serialize sub-select in "where" expression', function() {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]);
        var result = serializer.generate(query);
        assert.equal(result.sql, 'select * from table1 where (select ID from table1) = 1');
      });

      it('should assign limit ', function() {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]).limit(5);
        assert.equal(query._limit, 5);
      });

      it('should assign offset ', function() {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]).offset(5);
        assert.equal(query._offset, 5);
      });

    });
  });

})
;