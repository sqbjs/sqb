const assert = require('assert'),
    sqb = require('../');

describe('Oracle dialect', function () {

    describe('Serialize "select/from" part', function () {

        it('should serialize dual', function (done) {
            let statement = sqb.select().from();
            let result = statement.build({
                dialect: 'oracle'
            });
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

    });
});