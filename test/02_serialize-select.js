/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize select query -- serialize-select', function() {

  describe('Serialize "select/from" part', function() {

    it('should serialize * for when no columns given', function(done) {
      var query = sqb.select().columns().from('table1').join();
      var result = query.generate();
      assert.equal(result.sql, 'select * from table1');
      done();
    });

    it('should serialize when no tables given', function(done) {
      var query = sqb.select();
      var result = query.generate();
      assert.equal(result.sql, 'select *');
      done();
    });

    it('should serialize select/from - test 1', function(done) {
      var query = sqb.select('field1', 'field2', 'field3',
          'field4', 'field5', 'field6', 'field7', 'field8', 'field9',
          'field10').from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select field1, field2, field3, field4, field5, ' +
          'field6, field7, field8, field9, field10 from table1');
      done();
    });

    it('should serialize select/from - test 2', function(done) {
      var query = sqb.select('t1.field1 f1').from('schema1.table1 t1');
      var result = query.generate();
      assert.equal(result.sql, 'select t1.field1 f1 from schema1.table1 t1');
      done();
    });

    it('should serialize select/from - test 3', function(done) {
      var query = sqb.select('field1 f1', 'field2', sqb.raw('\nfield3'))
          .from('schema1.table1 t1', sqb.raw('\ntable2'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 f1, field2, field3 from schema1.table1 t1, table2');
      done();
    });

    it('should serialize select/from - test 4', function(done) {
      var query = sqb.select(['field1', 'field2', 'field3',
        'field4', 'field5', 'field6', 'field7', 'field8', 'field9',
        'field10', '']).from('table1', '').join(null).groupBy('').orderBy('');
      var result = query.generate();
      assert.equal(result.sql, 'select field1, field2, field3, field4, field5, ' +
          'field6, field7, field8, field9, field10 from table1');
      done();
    });

    it('should validate field name', function(done) {
      var ok;
      try {
        sqb.select('a..b').from();
      } catch (e) {
        ok = true;
      }
      assert.ok(ok);
      done();
    });

    it('should validate table name', function(done) {
      var ok;
      try {
        sqb.select().from('table1"');
      } catch (e) {
        ok = true;
      }
      assert.ok(ok);
      done();
    });

    it('should pretty print', function(done) {
      var query = sqb.select()
          .from('table1')
          .where(['ID', 1], ['name', 'value of the field should be too long'],
              ['ID', 1], ['ID', 12345678])
          .groupBy('field1', 'field2', sqb.raw('field3'));
      var result = query.generate({prettyPrint: true});
      assert.equal(result.sql, 'select * from table1\n' +
          'where ID = 1 and name = \'value of the field should be too long\' and\n' +
          '  ID = 1 and ID = 12345678\n' +
          'group by field1, field2, field3');
      done();
    });

  });

  describe('serialize "join" part', function() {

    it('should serialize join', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.join('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 inner join join1');
      done();
    });

    it('should serialize innerJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.innerJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 inner join join1');
      done();
    });

    it('should serialize leftJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.leftJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 left join join1');
      done();
    });

    it('should serialize leftOuterJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.leftOuterJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 left outer join join1');
      done();
    });

    it('should serialize rightJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.rightJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 right join join1');
      done();
    });

    it('should serialize rightOuterJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.rightOuterJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 right outer join join1');
      done();
    });

    it('should serialize outerJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.outerJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 outer join join1');
      done();
    });

    it('should serialize fullOuterJoin', function(done) {
      var query = sqb.select('field1').from('table1')
          .join(sqb.fullOuterJoin('join1'));
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1 full outer join join1');
      done();
    });

    it('should serialize wrong Join', function(done) {
      var ok;
      try {
        sqb.select('field1').from('table1')
            .join(1);
      } catch (e) {
        ok = true;
      }
      assert.ok(ok);
      done();
    });

    it('should serialize raw in columns', function(done) {
      var query = sqb.select(sqb.raw('"hello"')).from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select "hello" from table1');
      done();
    });

    it('should not serialize raw in columns if empty', function(done) {
      var query = sqb.select('field1', sqb.raw('')).from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select field1 from table1');
      done();
    });

    it('should serialize raw in "from"', function(done) {
      var query = sqb.select().from(sqb.raw('"hello"'));
      var result = query.generate();
      assert.equal(result.sql, 'select * from "hello"');
      done();
    });

    it('should not serialize raw in "from" if empty', function(done) {
      var query = sqb.select().from(sqb.raw(''));
      var result = query.generate();
      assert.equal(result.sql, 'select *');
      done();
    });

    it('should serialize raw in "join"', function(done) {
      var query = sqb.select()
          .from('table1')
          .join(sqb.join(sqb.raw('"hello"')));
      var result = query.generate();
      assert.equal(result.sql, 'select * from table1 inner join "hello"');
      done();
    });

    it('should serialize join/on', function(done) {
      var query = sqb.select().from('table1')
          .join(sqb.innerJoin('join1').on(['ID', 1]));
      var result = query.generate();
      assert.equal(result.sql, 'select * from table1 inner join join1 on ID = 1');
      done();
    });

  });

  describe('serialize "case" expressions', function() {

    it('should serialize single condition in "when"', function(done) {
      var query = sqb.select(
          sqb.case().when('col1', 5).then(1).else(100)
      ).from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select case when col1 = 5 then 1 else 100 end from table1');
      done();
    });

    it('should serialize without condition in "when"', function(done) {
      var query = sqb.select(
          sqb.case().when().then(1).else(100)
      ).from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select * from table1');
      done();
    });

    it('should serialize group of conditions in "when"', function(done) {
      var query = sqb.select(
          sqb.case().when(['col1', 5], 'or', ['col2', 4]).then(1).else(100)
      ).from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select case when col1 = 5 or col2 = 4 then 1 else 100 end from table1');
      done();
    });

    it('should serialize alias', function(done) {
      var query = sqb.select(
          sqb.case().when('col1', 5).then(1).else(100).as('col1')
      ).from('table1');
      var result = query.generate();
      assert.equal(result.sql, 'select case when col1 = 5 then 1 else 100 end col1 from table1');
      done();
    });

  });

  describe('Serialize "where" part', function() {

    describe('Serialize comparison operators', function() {

      it('should serialize "=" operator for field/value pair', function(done) {
        var query = sqb.select().from('table1').where(['ID', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = 1');
        done();
      });

      it('should serialize "=" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '=', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = 1');
        done();
      });

      it('should serialize ">" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '>', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID > 1');
        done();
      });

      it('should serialize ">=" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '>=', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID >= 1');
        done();
      });

      it('should serialize "!>" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '!>', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID !> 1');
        done();
      });

      it('should serialize "<" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '<', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID < 1');
        done();
      });

      it('should serialize "<=" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '<=', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID <= 1');
        done();
      });

      it('should serialize "!<" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '!<', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID !< 1');
        done();
      });

      it('should serialize "!=" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '!=', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID != 1');
        done();
      });

      it('should serialize "<>" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', '<>', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID <> 1');
        done();
      });

      it('should serialize "is" operator', function(done) {
        var query = sqb.select().from('table1').where(['ID', 'is', null]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID is null');
        done();
      });

      it('should serialize "like" operator', function(done) {
        var query = sqb.select()
            .from('table1')
            .where(['NAME', 'like', '%abc%']);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where NAME like \'%abc%\'');
        done();
      });

      it('should serialize wrong operator', function(done) {
        var ok;
        try {
          var query = sqb.select()
              .from('table1')
              .where(['NAME', '>>', '%abc%']);
        } catch (e) {
          ok = 1;
        }
        assert.ok(ok);
        done();
      });

      it('should serialize "between" operator', function(done) {
        var query = sqb.select()
            .from('table1')
            .where(['id', 'between', [1, 4]]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where id between 1 and 4');
        done();
      });

      it('should serialize "between" operator test2', function(done) {
        var query = sqb.select()
            .from('table1')
            .where(['id', 'between', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where id between 1 and 1');
        done();
      });

      it('should serialize sub group', function(done) {
        var query = sqb.select().from('table1').where(['ID', 'is', null],
            [
              ['ID2', 1], 'or', ['ID2', 2]
            ]
        );
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID is null and (ID2 = 1 or ID2 = 2)');
        done();
      });

      it('should serialize wrong sub group', function(done) {
        var ok;
        try {
          var query = sqb.select().from('table1').where(['ID', 'is', null],
              [
                [2, 1], 'orr', [2, 2]
              ]
          );
        } catch (e) {
          ok = 1;
        }
        assert.ok(ok);
        done();
      });

      it('should serialize raw in where test1', function(done) {
        var query = sqb.select().from('table1').where(sqb.raw('id = 1'));
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where id = 1');
        done();
      });

      it('should serialize raw in "where" test2', function(done) {
        var query = sqb.select().from('table1').where([[sqb.raw('ID')]]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where (ID = null)');
        done();
      });

      it('should use double quotes for reserved words test1', function(done) {
        var query = sqb.select().from('table1').where(['select', 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where "select" = 1');
        done();
      });

      it('should serialize raw', function(done) {
        var query = sqb.select('field1', sqb.raw('')).from('table1');
        var result = query.generate();
        assert.equal(result.sql, 'select field1 from table1');
        done();
      });

      it('should set reserved words', function(done) {
        var xx = new sqb.serializer();
        xx.reservedWords = xx.reservedWords + 'newword';
        done();
      });

      it('should set strict Params', function(done) {
        var xx = new sqb.serializer();
        xx.strictParams = true;
        done();
      });

      it('should get dialect', function(done) {
        sqb.use(require('./support/test_serializer'));
        var xx = new sqb.serializer(
            {
              dialect: 'testdialect'
            }
        );
        assert.equal(xx.dialect, 'testdialect');
        done();
      });

    });

    describe('Serialize values', function() {

      it('should serialize string', function(done) {
        var query = sqb.select().from('table1').where(['ID', 'abcd']);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = \'abcd\'');
        done();
      });

      it('should serialize number', function(done) {
        var query = sqb.select().from('table1').where(['ID', 123]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = 123');
        done();
      });

      it('should serialize date', function(done) {
        var query = sqb.select()
            .from('table1')
            .where(['ID', new Date(2017, 0, 1, 10, 30, 15)]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = \'2017-01-01 10:30:15\'');
        done();
      });

      it('should serialize array', function(done) {
        var query = sqb.select().from('table1').where(['ID', [1, 2, 3]]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID in (1,2,3)');

        query = sqb.select().from('table1').where(['ID', '!=', [1, 2, 3]]);
        result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID not in (1,2,3)');
        done();
      });

      it('should serialize null', function(done) {
        var query = sqb.select().from('table1').where(['ID', null]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = null');
        done();
      });

      it('should serialize raw', function(done) {
        var query = sqb.select()
            .from('table1')
            .where(['ID', sqb.raw('current_date')]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where ID = current_date');
        done();
      });

      it('should serialize parameter', function(done) {
        var query = sqb.select().from('table1').where(['ID', /ID/]);
        var result = query.generate(undefined, {ID: 1});
        assert.equal(result.sql, 'select * from table1 where ID = :ID');
        assert.equal(result.values.ID, 1);
        done();
      });

      it('should serialize parameter for "between"', function(done) {
        const d1 = new Date();
        const d2 = new Date();
        const serializer = sqb.serializer({
              paramType: sqb.ParamType.QUESTION_MARK
            }),
            query = sqb.select().from('table1').where(
                ['adate', 'between', /ADATE/],
                ['bdate', 'between', /BDATE/]
            );
        var result = serializer.generate(query, {
          ADATE: [d1, d2],
          BDATE: d1
        });
        assert.equal(result.sql, 'select * from table1 where adate between ? and ? and bdate between ? and ?');
        assert.deepEqual(result.values, [d1, d2, d2, null]);
        query.params({
          ADATE: [d1, d2],
          BDATE: d1
        });
        result = query.generate({paramType: sqb.ParamType.COLON});
        assert.equal(result.sql, 'select * from table1 where adate between :ADATE1 and :ADATE2 and bdate between :BDATE1 and :BDATE2');
        assert.deepEqual(result.values.ADATE1, d1);
        assert.deepEqual(result.values.ADATE2, d2);
        assert.deepEqual(result.values.BDATE1, d1);
        assert.deepEqual(result.values.BDATE2, null);
        done();
      });

      it('should validate generate{params} argument', function(done) {
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
        done();
      });

    });

    describe('Serialize "order by" part', function() {

      it('should serialize (fieldname)', function(done) {
        var query = sqb.select()
            .from('table1')
            .orderBy('field1', 'field2');
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 order by field1, field2');
        done();
      });

      it('should serialize (fieldname)', function(done) {
        var query = sqb.select()
            .from('table1')
            .orderBy('field1', 'field2 descending', sqb.raw('field3'), sqb.raw(''));
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 order by field1, field2 desc, field3');
        done();
      });

      it('should validate order by', function(done) {
        var ok;
        try {
          sqb.select().from().orderBy('field2 dsss');
        } catch (e) {
          ok = true;
        }
        assert.ok(ok);
        done();
      });

    });

    describe('Sub-selects', function() {

      it('should serialize sub-select in "columns" part', function(done) {
        var query = sqb.select(sqb.select('ID').from('table2').as('t1'))
            .from('table1');
        var result = query.generate();
        assert.equal(result.sql, 'select (select ID from table2) t1 from table1');
        query = sqb.select(sqb.select('ID').from('table2')).from('table1');
        result = query.generate();
        assert.equal(result.sql, 'select (select ID from table2) from table1');
        done();
      });

      it('should serialize sub-select in "from" part', function(done) {
        var query = sqb.select().from(sqb.select().from('table1').as('t1'));
        var result = query.generate();
        assert.equal(result.sql, 'select * from (select * from table1) t1');
        done();
      });

      it('should serialize sub-select in "join" part', function(done) {
        var query = sqb.select()
            .from('table1')
            .join(sqb.innerJoin(sqb.select().from('table1').as('t1')));
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 inner join (select * from table1) t1');
        done();
      });

      it('should serialize sub-select in "where" expression', function(done) {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]);
        var result = query.generate();
        assert.equal(result.sql, 'select * from table1 where (select ID from table1) = 1');
        done();
      });

      it('should assign limit ', function(done) {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]).limit(5);
        assert.equal(query._limit, 5);
        done();
      });

      it('should assign offset ', function(done) {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]).offset(5);
        assert.equal(query._offset, 5);
        done();
      });

      it('should assign on Fetch Row', function(done) {
        var query = sqb.select()
            .from('table1')
            .where([sqb.select('ID').from('table1').as('t1'), 1]).onFetchRow(
                function() {
                }
            );
        assert.ok(query._onfetchrow && query._onfetchrow.length > 0);
        done();
      });

    });
  });

})
;