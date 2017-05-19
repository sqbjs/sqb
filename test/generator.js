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