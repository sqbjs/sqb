const assert = require('assert'),
    sqb = require('../');

describe('Generator', function () {

    describe('Generate "select/from" part', function () {

        it('should generate * for when no columns given', function (done) {
            let statement = sqb.select().from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select * from table1');
            done();
        });

        it('should generate when no tables given', function (done) {
            let statement = sqb.select();
            let result = statement.build();
            assert.equal(result.sql, 'select *');
            done();
        });

        it('should generate select/from - test 1', function (done) {
            let statement = sqb.select('field1').from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1');
            done();
        });

        it('should generate select/from - test 2', function (done) {
            let statement = sqb.select('t1.field1 f1').from('schema1.table1 t1');
            let result = statement.build();
            assert.equal(result.sql, 'select t1.field1 f1 from schema1.table1 t1');
            done();
        });

        it('should generate select/from - test 3', function (done) {
            let statement = sqb.select(sqb.column('field1 f1')).from('schema1.table1 t1');
            let result = statement.build();
            assert.equal(result.sql, 'select field1 f1 from schema1.table1 t1');
            done();
        });

        it('should validate field name', function (done) {
            let ok;
            try {
                sqb.select('a..b').from();
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should validate table name', function (done) {
            let ok;
            try {
                sqb.select().from('table1"');
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

    });

    describe('Generate "join" part', function () {

        it('should generate join', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.join('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 inner join join1');
            done();
        });

        it('should generate innerJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.innerJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 inner join join1');
            done();
        });

        it('should generate leftJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.leftJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 left join join1');
            done();
        });

        it('should generate leftOuterJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.leftOuterJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 left outer join join1');
            done();
        });

        it('should generate rightJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.rightJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 right join join1');
            done();
        });

        it('should generate rightOuterJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.rightOuterJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 right outer join join1');
            done();
        });

        it('should generate outerJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.outerJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 outer join join1');
            done();
        });

        it('should generate fullOuterJoin', function (done) {
            let statement = sqb.select(sqb.column('field1')).from('table1')
                .join(sqb.fullOuterJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 full outer join join1');
            done();
        });

        it('should generate raw in columns', function (done) {
            let statement = sqb.select(sqb.raw('"hello"')).from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select "hello" from table1');
            done();
        });

        it('should not generate raw in columns if empty', function (done) {
            let statement = sqb.select('field1', sqb.raw('')).from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1');
            done();
        });

        it('should generate raw in "from"', function (done) {
            let statement = sqb.select().from(sqb.raw('"hello"'));
            let result = statement.build();
            assert.equal(result.sql, 'select * from "hello"');
            done();
        });

        it('should not generate raw in "from" if empty', function (done) {
            let statement = sqb.select().from(sqb.raw(''));
            let result = statement.build();
            assert.equal(result.sql, 'select *');
            done();
        });

        it('should generate raw in "join"', function (done) {
            let statement = sqb.select().from('table1').join(sqb.join(sqb.raw('"hello"')));
            let result = statement.build();
            assert.equal(result.sql, 'select * from table1 inner join "hello"');
            done();
        });

        it('should generate join/on', function (done) {
            let statement = sqb.select().from('table1')
                .join(sqb.innerJoin('join1').on(sqb.and('ID', 1)));
            let result = statement.build();
            assert.equal(result.sql, 'select * from table1 inner join join1 on ID = 1');
            done();
        });

    });

    describe('Generate "where" part', function () {

        describe('Generate comparison operators', function () {

            it('should generate "=" operator for field/value pair', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID = 1');
                done();
            });

            it('should generate "=" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '=', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID = 1');
                done();
            });

            it('should generate ">" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '>', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID > 1');
                done();
            });

            it('should generate ">=" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '>=', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID >= 1');
                done();
            });

            it('should generate "!>" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '!>', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID !> 1');
                done();
            });

            it('should generate "<" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '<', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID < 1');
                done();
            });

            it('should generate "<=" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '<=', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID <= 1');
                done();
            });

            it('should generate "!<" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '!<', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID !< 1');
                done();
            });

            it('should generate "!=" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '!=', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID != 1');
                done();
            });

            it('should generate "<>" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', '<>', 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID <> 1');
                done();
            });

            it('should generate "is" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', 'is', null));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID is null');
                done();
            });

            it('should generate "like" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('NAME', 'like', "%abc%"));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where NAME like '%abc%'");
                done();
            });

            it('should generate "between" operator', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('id', 'between', 1, 4));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where id between 1 and 4");

                statement = sqb.select().from('table1').where(sqb.and('id', 'between', [1, 4]));
                result = statement.build();
                assert.equal(result.sql, "select * from table1 where id between 1 and 4");
                done();
            });

            it('should generate sub group', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', 'is', null),
                    sqb.and([
                        sqb.or('ID2', 1), sqb.or('ID2', 2)
                    ])
                );
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID is null and (ID2 = 1 or ID2 = 2)');
                done();
            });

            it('should generate raw in "where"', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and([sqb.raw('ID=1')]));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where (ID=1)');
                done();
            });

            it('should handle reserved words', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and("select", 1));
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where "select" = 1');
                done();
            });


        });

        describe('Generate values', function () {

            it('should generate string', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', 'abcd'));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = 'abcd'");
                done();
            });

            it('should generate number', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', 123));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = 123");
                done();
            });

            it('should generate date', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', new Date(2017, 0, 1, 10, 30, 15)));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = '2017-01-01 10:30:15'");
                done();
            });

            it('should generate array', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', [1, 2, 3]));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID in (1,2,3)");

                statement = sqb.select().from('table1').where(sqb.and('ID', '!=', [1, 2, 3]));
                result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID not in (1,2,3)");
                done();
            });

            it('should generate null', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', null));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = null");
                done();
            });

            it('should generate raw', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', sqb.raw('current_date')));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = current_date");
                done();
            });

            it('should generate parameter', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', /ID/));
                let result = statement.build({
                    params: {
                        ID: 1
                    }
                });
                assert.equal(result.sql, "select * from table1 where ID = :ID");
                assert.equal(result.params.ID, 1);
                done();
            });

            it('should generate parameter for "between"', function (done) {
                let statement = sqb.select().from('table1').where(
                    sqb.and('adate', 'between', /adate/),
                    sqb.and('bdate', 'between', /bdate/)
                );
                let d1 = new Date(), d2 = new Date(),
                    result = statement.build({
                        params: {
                            adate: [d1, d2],
                            bdate: d1,
                        }
                    });
                assert.equal(result.sql, "select * from table1 where adate between :adate1 and :adate2 and bdate between :bdate1 and :bdate2");
                assert.deepEqual(result.params.adate1, d1);
                assert.deepEqual(result.params.adate2, d2);
                assert.deepEqual(result.params.bdate1, d1);
                assert.deepEqual(result.params.bdate2, null);
                done();
            });

        });

        describe('Generate "order by" part', function () {

            it('should generate order by', function (done) {
                let statement = sqb.select().from('table1').orderBy('field1', 'field2 descending');
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 order by field1, field2 desc");
                done();
            });
        });

        describe('Sub-selects', function () {

            it('should generate sub-select in "columns" part', function (done) {
                let statement = sqb.select(sqb.select('ID').from('table2').alias('t1')).from('table1');
                let result = statement.build();
                assert.equal(result.sql, "select (select ID from table2) t1 from table1");
                statement = sqb.select(sqb.select('ID').from('table2')).from('table1');
                result = statement.build();
                assert.equal(result.sql, "select (select ID from table2) from table1");
                done();
            });

            it('should generate sub-select in "from" part', function (done) {
                let statement = sqb.select().from(sqb.select().from('table1').alias('t1'));
                let result = statement.build();
                assert.equal(result.sql, "select * from (select * from table1) t1");
                done();
            });

            it('should generate sub-select in "join" part', function (done) {
                let statement = sqb.select().from('table1').join(sqb.innerJoin(sqb.select().from('table1').alias('t1')));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 inner join (select * from table1) t1");
                done();
            });

            it('should generate sub-select in "where" part', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and(sqb.select('ID').from('table1').alias('t1'), 1));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where (select ID from table1) = 1");
                done();
            });

        });
    });

});