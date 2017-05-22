const assert = require('assert'),
    sqb = require('../');

describe('Oracle dialect', function () {

    describe('Serialize "select" statements', function () {

        it('should serialize dual', function (done) {
            let statement = sqb.select().from();
            let result = statement.build('oracle');
            assert.equal(result.sql, 'select * from dual');
            done();
        });

        it('should replace "=" to "is" when value is null', function (done) {
            let statement = sqb.select().from().where(sqb.and('ID',null));
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, 'select * from dual where ID is null');
            done();
        });

        it('should serialize date', function (done) {
            let statement = sqb.select().from('table1').where(sqb.and('ID', new Date(2017, 0, 1, 10, 30, 15)));
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from table1 where ID = to_date('2017-01-01 10:30:15', 'yyyy-mm-dd hh24:mi:ss')");
            done();
        });

        it('should serialize "limit"', function (done) {
            let statement = sqb.select().from('table1').limit(10);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (select * from table1) t) where row$number <= 10");
            done();
        });

        it('should serialize "limit/offset"', function (done) {
            let statement = sqb.select().from('table1').offset(5).limit(10);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (select * from table1) t) where row$number >= 5 and row$number <= 10");
            done();
        });

        it('should serialize "offset"', function (done) {
            let statement = sqb.select().from('table1').offset(5);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (select * from table1) t) where row$number >= 5");
            done();
        });

        it('should serialize "limit/offset" pretty print ', function (done) {
            let statement = sqb.select().from('table1').offset(5).limit(10);
            let result = statement.build({
                dialect: 'oracle',
                prettyPrint: true
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (\n  select * from table1\n) t)\nwhere row$number >= 5 and row$number <= 10");
            done();
        });

    });
});
