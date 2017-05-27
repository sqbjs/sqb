/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize select statements', function () {

    describe('Serialize "select/from" part', function () {

        it('should serialize * for when no columns given', function (done) {
            let statement = sqb.select().columns().from('table1').join();
            let result = statement.build();
            assert.equal(result.sql, 'select * from table1');
            done();
        });

        it('should serialize when no tables given', function (done) {
            let statement = sqb.select();
            let result = statement.build();
            assert.equal(result.sql, 'select *');
            done();
        });

        it('should serialize select/from - test 1', function (done) {
            let statement = sqb.select('field1').from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1');
            done();
        });

        it('should serialize select/from - test 2', function (done) {
            let statement = sqb.select('t1.field1 f1').from('schema1.table1 t1');
            let result = statement.build();
            assert.equal(result.sql, 'select t1.field1 f1 from schema1.table1 t1');
            done();
        });

        it('should serialize select/from - test 3', function (done) {
            let statement = sqb.select('field1 f1').from('schema1.table1 t1');
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

        it('should pretty print', function (done) {
            let statement = sqb.select()
                .from('table1')
                .where(['ID', 1], ['name', 'value of the field should be too long'],
                    ['ID', 1], ['ID', 12345678])
                .groupBy('field1', 'field2', sqb.raw('field3'));
            let result = statement.build({prettyPrint: true});
            assert.equal(result.sql, "select * from table1\nwhere ID = 1 and name = 'value of the field should be too long' and ID = 1\n    and ID = 12345678\ngroup by field1, field2, field3");
            done();
        });


    });

    describe('serialize "join" part', function () {

        it('should serialize join', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.join('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 inner join join1');
            done();
        });

        it('should serialize innerJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.innerJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 inner join join1');
            done();
        });

        it('should serialize leftJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.leftJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 left join join1');
            done();
        });

        it('should serialize leftOuterJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.leftOuterJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 left outer join join1');
            done();
        });

        it('should serialize rightJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.rightJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 right join join1');
            done();
        });

        it('should serialize rightOuterJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.rightOuterJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 right outer join join1');
            done();
        });

        it('should serialize outerJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.outerJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 outer join join1');
            done();
        });

        it('should serialize fullOuterJoin', function (done) {
            let statement = sqb.select('field1').from('table1')
                .join(sqb.fullOuterJoin('join1'));
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1 full outer join join1');
            done();
        });

        it('should serialize raw in columns', function (done) {
            let statement = sqb.select(sqb.raw('"hello"')).from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select "hello" from table1');
            done();
        });

        it('should not serialize raw in columns if empty', function (done) {
            let statement = sqb.select('field1', sqb.raw('')).from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select field1 from table1');
            done();
        });

        it('should serialize raw in "from"', function (done) {
            let statement = sqb.select().from(sqb.raw('"hello"'));
            let result = statement.build();
            assert.equal(result.sql, 'select * from "hello"');
            done();
        });

        it('should not serialize raw in "from" if empty', function (done) {
            let statement = sqb.select().from(sqb.raw(''));
            let result = statement.build();
            assert.equal(result.sql, 'select *');
            done();
        });

        it('should serialize raw in "join"', function (done) {
            let statement = sqb.select().from('table1').join(sqb.join(sqb.raw('"hello"')));
            let result = statement.build();
            assert.equal(result.sql, 'select * from table1 inner join "hello"');
            done();
        });

        it('should serialize join/on', function (done) {
            let statement = sqb.select().from('table1')
                .join(sqb.innerJoin('join1').on(['ID', 1]));
            let result = statement.build();
            assert.equal(result.sql, 'select * from table1 inner join join1 on ID = 1');
            done();
        });

    });

    describe('Serialize "where" part', function () {

        describe('Serialize comparison operators', function () {

            it('should serialize "=" operator for field/value pair', function (done) {
                let statement = sqb.select().from('table1').where(['ID', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID = 1');
                done();
            });

            it('should serialize "=" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '=', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID = 1');
                done();
            });

            it('should serialize ">" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '>', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID > 1');
                done();
            });

            it('should serialize ">=" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '>=', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID >= 1');
                done();
            });

            it('should serialize "!>" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '!>', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID !> 1');
                done();
            });

            it('should serialize "<" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '<', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID < 1');
                done();
            });

            it('should serialize "<=" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '<=', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID <= 1');
                done();
            });

            it('should serialize "!<" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '!<', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID !< 1');
                done();
            });

            it('should serialize "!=" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '!=', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID != 1');
                done();
            });

            it('should serialize "<>" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', '<>', 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID <> 1');
                done();
            });

            it('should serialize "is" operator', function (done) {
                let statement = sqb.select().from('table1').where(['ID', 'is', null]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID is null');
                done();
            });

            it('should serialize "like" operator', function (done) {
                let statement = sqb.select().from('table1').where(['NAME', 'like', "%abc%"]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where NAME like '%abc%'");
                done();
            });

            it('should serialize "between" operator', function (done) {
                let statement = sqb.select().from('table1').where(['id', 'between', [1, 4]]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where id between 1 and 4");
                done();
            });

            it('should serialize sub group', function (done) {
                let statement = sqb.select().from('table1').where(['ID', 'is', null],
                    [
                        ['ID2', 1], 'or', ['ID2', 2]
                    ]
                );
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where ID is null and (ID2 = 1 or ID2 = 2)');
                done();
            });

            it('should serialize raw in "where"', function (done) {
                let statement = sqb.select().from('table1').where([[sqb.raw('ID=1')]]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where (ID=1)');
                done();
            });

            it('should handle reserved words', function (done) {
                let statement = sqb.select().from('table1').where(["select", 1]);
                let result = statement.build();
                assert.equal(result.sql, 'select * from table1 where "select" = 1');
                done();
            });


        });

        describe('Serialize values', function () {

            it('should serialize string', function (done) {
                let statement = sqb.select().from('table1').where(['ID', 'abcd']);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = 'abcd'");
                done();
            });

            it('should serialize number', function (done) {
                let statement = sqb.select().from('table1').where(['ID', 123]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = 123");
                done();
            });

            it('should serialize date', function (done) {
                let statement = sqb.select().from('table1').where(['ID', new Date(2017, 0, 1, 10, 30, 15)]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = '2017-01-01 10:30:15'");
                done();
            });

            it('should serialize array', function (done) {
                let statement = sqb.select().from('table1').where(['ID', [1, 2, 3]]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID in (1,2,3)");

                statement = sqb.select().from('table1').where(['ID', '!=', [1, 2, 3]]);
                result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID not in (1,2,3)");
                done();
            });

            it('should serialize null', function (done) {
                let statement = sqb.select().from('table1').where(['ID', null]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = null");
                done();
            });

            it('should serialize raw', function (done) {
                let statement = sqb.select().from('table1').where(['ID', sqb.raw('current_date')]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = current_date");
                done();
            });

            it('should serialize parameter', function (done) {
                let statement = sqb.select().from('table1').where(['ID', /ID/]);
                let result = statement.build({
                    params: {
                        ID: 1
                    }
                });
                assert.equal(result.sql, "select * from table1 where ID = ?");
                assert.equal(result.params[0], 1);
                done();
            });

            it('should serialize parameter for "between"', function (done) {
                let serializer = sqb.serializer(),
                    statement = sqb.select().from('table1').where(
                        ['adate', 'between', /adate/],
                        ['bdate', 'between', /bdate/]
                    );
                let d1 = new Date(), d2 = new Date(),
                    result = serializer.build(statement, {
                        ADATE: [d1, d2],
                        BDATE: d1,
                    });
                assert.equal(result.sql, "select * from table1 where adate between ? and ? and bdate between ? and ?");
                assert.deepEqual(result.params, [d1, d2, d2, null]);
                result = statement.build({
                    namedParams: true,
                    params: {
                        ADATE: [d1, d2],
                        BDATE: d1,
                    }
                });
                assert.equal(result.sql, "select * from table1 where adate between :ADATE1 and :ADATE2 and bdate between :BDATE1 and :BDATE2");
                assert.deepEqual(result.params.ADATE1, d1);
                assert.deepEqual(result.params.ADATE2, d2);
                assert.deepEqual(result.params.BDATE1, d1);
                assert.deepEqual(result.params.BDATE2, null);
                done();
            });

            it('should validate build{params} argument', function (done) {
                let ok;
                try {
                    let serializer = sqb.serializer();
                    sqb.select();
                    serializer.build(undefined, 123);
                } catch (e) {
                    ok = true;
                }
                assert.ok(ok);
                done();
            });

        });


        describe('Serialize "order by" part', function () {

            it('should serialize order by', function (done) {
                let statement = sqb.select().from('table1').orderBy('field1', 'field2 descending', sqb.raw('field3'), sqb.raw(''));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 order by field1, field2 desc, field3");
                done();
            });

            it('should validate order by', function (done) {
                let ok;
                try {
                    sqb.select().from().orderBy('field2 dsss');
                } catch (e) {
                    ok = true;
                }
                assert.ok(ok);
                done();
            });


        });

        describe('Sub-selects', function () {

            it('should serialize sub-select in "columns" part', function (done) {
                let statement = sqb.select(sqb.select('ID').from('table2').alias('t1')).from('table1');
                let result = statement.build();
                assert.equal(result.sql, "select (select ID from table2) t1 from table1");
                statement = sqb.select(sqb.select('ID').from('table2')).from('table1');
                result = statement.build();
                assert.equal(result.sql, "select (select ID from table2) from table1");
                done();
            });

            it('should serialize sub-select in "from" part', function (done) {
                let statement = sqb.select().from(sqb.select().from('table1').alias('t1'));
                let result = statement.build();
                assert.equal(result.sql, "select * from (select * from table1) t1");
                done();
            });

            it('should serialize sub-select in "join" part', function (done) {
                let statement = sqb.select().from('table1').join(sqb.innerJoin(sqb.select().from('table1').alias('t1')));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 inner join (select * from table1) t1");
                done();
            });

            it('should serialize sub-select in "where" part', function (done) {
                let statement = sqb.select().from('table1').where([sqb.select('ID').from('table1').alias('t1'), 1]);
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where (select ID from table1) = 1");
                done();
            });

        });
    });

})
;