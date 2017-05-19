const assert = require('assert'),
    sqb = require('../');

describe('Generator', function () {

    it('should configure', function (done) {
        let generator = sqb.generator({
            dialect: 'oracledb',
            prettyPrint: 1,
            namedParams: 1,
            params: {
                a: 1
            }
        });
        assert.equal(generator.dialect, 'oracle');
        assert.equal(generator.prettyPrint, true);
        assert.equal(generator.namedParams, true);
        assert.deepEqual(generator._inputParams, {a: 1});
        done();
    });


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

        it('should generate raw in select', function (done) {
            let statement = sqb.select(sqb.raw('"hello"')).from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select "hello" from table1');
            done();
        });

        it('should generate raw in "from"', function (done) {
            let statement = sqb.select().from(sqb.raw('"hello"'));
            let result = statement.build();
            assert.equal(result.sql, 'select * from "hello"');
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
                .join(sqb.innerJoin('join1').on(sqb.and('ID',1)));
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

            it('should generate sub-select in "from" part', function (done) {
                let statement = sqb.select().from(sqb.select().from('table1').alias('t1'));
                let result = statement.build();
                assert.equal(result.sql, "select * from (select * from table1) t1");
                done();
            });

            it('should generate sub-select in "select" part', function (done) {
                let statement = sqb.select(sqb.select('ID').from('table2').alias('t1')).from('table1');
                let result = statement.build();
                assert.equal(result.sql, "select (select ID from table2) t1 from table1");
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


    describe('Generator configuration', function () {

        it('Should pretty print - test1', function (done) {
            let statement = sqb.select('field1').from('table1').join(sqb.join('table2'));
            let result = statement.build({
                prettyPrint: true
            });
            assert.equal(result.sql, 'select field1 from table1\n  inner join table2');
            done();
        });

        it('Should pretty print - test2', function (done) {
            let statement = sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6').from('table1').join(sqb.join('table2'));
            let result = statement.build({
                prettyPrint: true
            });
            assert.equal(result.sql, 'select field1, field2, field3, field4, field5, field6\nfrom table1\n  inner join table2');
            done();
        });

        it('Should pretty print - test3', function (done) {
            let statement = sqb.select('field1', 'field2', 'field3', 'field4', 'field5', 'field6').from('table1').where(
                sqb.and('field1', 'abcdefgh1234567890'),
                sqb.and('field2', 'abcdefgh1234567890'),
                sqb.and('field3', 'abcdefgh1234567890')
            ).orderBy('ID');
            let result = statement.build({
                prettyPrint: true
            });
            assert.equal(result.sql, "select field1, field2, field3, field4, field5, field6\nfrom table1" +
                "\nwhere field1 = 'abcdefgh1234567890' and field2 = 'abcdefgh1234567890'\n    and field3 = 'abcdefgh1234567890'" +
                "\norder by ID");
            done();
        });

        it('Should generate indexed params', function (done) {
            let statement = sqb.select().from('table1').where(sqb.and('ID', /ID/));
            let result = statement.build({
                namedParams: false
            });
            assert.equal(result.sql, "select * from table1 where ID = ?");
            done();
        });

    });
});