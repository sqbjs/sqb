/*
 * Tests for mounting capabilities (extended from connect)
 * Original file ([connect]/test/mounting.js)
 */

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

        it('should generate raw', function (done) {
            let statement = sqb.select(sqb.raw('"hello"')).from('table1');
            let result = statement.build();
            assert.equal(result.sql, 'select "hello" from table1');
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
                let statement = sqb.select().from('table1').where(sqb.and('ID', new Date(2017,0,1,10,30,15)));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = '2017-01-01 10:30:15'");
                done();
            });

            it('should generate array', function (done) {
                let statement = sqb.select().from('table1').where(sqb.and('ID', [1,2,3]));
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID in (1,2,3)");
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
                let result = statement.build();
                assert.equal(result.sql, "select * from table1 where ID = :ID");
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

    });


    describe('Should generate pretty sql', function () {

        it('test 1', function (done) {
            let statement = sqb.select('field1').from('table1').join(sqb.join('table2'));
            let result = statement.build({
                prettyPrint: true
            });
            assert.equal(result.sql, 'select field1 from table1\n  inner join table2');
            done();
        });

    });
});