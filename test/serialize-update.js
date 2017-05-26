const assert = require('assert'),
    sqb = require('../'),
    and = sqb.and;

describe('Serialize update statements', function () {

    it('should serialize formal update statement', function (done) {
        let statement = sqb.update('table1').set({
            name: 'name',
            address: 'earth'
        }).where(['id', 1]);
        let result = statement.build();
        assert.equal(result.sql, "update table1 set NAME = 'name', ADDRESS = 'earth' where id = 1");
        done();
    });

    it('should serialize params', function (done) {
        let statement = sqb.update('table1').set({
            name: /name/,
            address: /earth/
        }).where(['id', /id/]);
        let result = statement.build(undefined,
            {
                id: 1,
                name: 'name',
                address: 'earth'
            });
        assert.equal(result.sql, "update table1 set NAME = :NAME, ADDRESS = :ADDRESS where id = :ID");
        done();
    });

    it('should use Raw in table', function (done) {
        let statement = sqb.update(sqb.raw('table1')).set({
            name: 'name',
            address: 'earth'
        }).where(['id', 1]);

        let result = statement.build();
        assert.equal(result.sql, "update table1 set NAME = 'name', ADDRESS = 'earth' where id = 1");
        done();
    });

    it('should use Raw in values', function (done) {
        let statement = sqb.update('table1').set(sqb.raw("NAME = 'name', ADDRESS = 'earth'")).where(['id', 1]);
        let result = statement.build();
        assert.equal(result.sql, "update table1 set NAME = 'name', ADDRESS = 'earth' where id = 1");
        done();
    });

    it('should check invalid argument for in "set"', function (done) {
        let ok;
        try {
            sqb.update('table1').set(1).where();
        } catch (e) {
            ok = true;
        }

        assert.ok(ok);
        done();
    });

    it('should pretty print', function (done) {
        let statement = sqb.update('table1').set({
            name: 'name',
            address: 'earth'
        }).where(['id', 1]);
        let result = statement.build({
            prettyPrint: true
        });
        assert.equal(result.sql, "update table1 set\n    NAME = 'name', ADDRESS = 'earth'\nwhere id = 1");
        done();
    });


});