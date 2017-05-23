const assert = require('assert'),
    sqb = require('../'),
    and = sqb.and;

describe('Serialize delete statements', function () {

    it('should serialize formal delete statement', function (done) {
        let statement = sqb.delete('table1').where(and('id',1));
        let result = statement.build();
        assert.equal(result.sql, "delete from table1 where id = 1");

        statement = sqb.delete().from('table1').where(and('id',1));
        result = statement.build();
        assert.equal(result.sql, "delete from table1 where id = 1");
        done();
    });

});