/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serializer', function () {

    it('should configure', function (done) {
        let serializer = sqb.serializer({
            dialect: 'oracle',
            prettyPrint: 1,
            namedParams: 1
        });
        assert.equal(serializer.dialect, 'oracle');
        assert.equal(serializer.prettyPrint, true);
        assert.equal(serializer.namedParams, true);
        done();
    });


    it('should check arguments in .build()', function (done) {
        let ok;
        try {
            let serializer = sqb.serializer();
            serializer.build(1);
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
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
            ['field1', 'abcdefgh1234567890'],
            ['field2', 'abcdefgh1234567890'],
            ['field3', 'abcdefgh1234567890']
        ).orderBy('ID');
        let result = statement.build({
            prettyPrint: true
        });
        assert.equal(result.sql, "select field1, field2, field3, field4, field5, field6\nfrom table1" +
            "\nwhere field1 = 'abcdefgh1234567890' and field2 = 'abcdefgh1234567890'\n    and field3 = 'abcdefgh1234567890'" +
            "\norder by ID");
        done();
    });

    it('Should serialize indexed params', function (done) {
        let statement = sqb.select().from('table1').where(['ID', /ID/]);
        let result = statement.build({
            namedParams: false
        }, {id: 5});
        assert.equal(result.sql, "select * from table1 where ID = ?");
        assert.deepEqual(result.params, [5]);
        done();
    });

    describe('Dialects', function () {

        it('should initialize generic serializer', function (done) {
            let obj = sqb.serializer();
            assert.ok(obj instanceof sqb.Serializer);
            done();
        });

        it('should initialize "oracle" dialect', function (done) {
            let obj = sqb.serializer('oracle');
            assert.ok(obj instanceof sqb.Serializer);
            assert.equal(obj.dialect, 'oracle');
            done();
        });

        it('should return serializer that already passed in first argument', function (done) {
            let obj = sqb.serializer('oracle');
            let obj2 = sqb.serializer(obj);
            assert.ok(obj === obj2);
            done();
        });

    });

});