const assert = require('assert'),
    sqb = require('../'),
    and = sqb.and;

describe('Serialize update statements', function () {

    it('should serialize formal update statement', function (done) {
        let statement = sqb.update('table1').set({
            name: 'name',
            address: 'earth'
        }).where(and('id', 1));
        let result = statement.build();
        assert.equal(result.sql, "update table1 set NAME = 'name', ADDRESS = 'earth' where id = 1");
        done();
    });

    it('should serialize params', function (done) {
        let statement = sqb.update('table1').set({
            name: /name/,
            address: /earth/
        }).where(and('id', /id/));
        let result = statement.build(undefined,
            {
                id: 1,
                name: 'name',
                address: 'earth'
            });
        assert.equal(result.sql, "update table1 set NAME = :NAME, ADDRESS = :ADDRESS where id = :ID");
        done();
    });

});