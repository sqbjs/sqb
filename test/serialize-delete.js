/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize delete statements', function () {

    it('should serialize formal delete statement without raw', function (done) {
        let statement = sqb.delete('table1').where(['id', 1]);
        let result = statement.build();
        assert.equal(result.sql, "delete from table1 where id = 1");

        statement = sqb.delete().from('table1').where(['id', 1]);
        result = statement.build();
        assert.equal(result.sql, "delete from table1 where id = 1");
        done();
    });

  it('should serialize formal delete statement with raw', function (done) {
    let statement = sqb.delete(sqb.raw('table1')).where(['id', 1]);
    let result = statement.build();
    assert.equal(result.sql, "delete from table1 where id = 1");

    statement = sqb.delete().from(sqb.raw('a')).where(['id', 1]);
    result = statement.build();
    assert.equal(result.sql, "delete from a where id = 1");
    done();
  });
});