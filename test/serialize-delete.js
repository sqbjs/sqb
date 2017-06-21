/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize delete statements', function() {

  it('should serialize formal delete statement without raw', function(done) {
    let statement = sqb.delete('table1').where(['id', 1]);
    let result = statement.build();
    assert.equal(result.sql, 'delete from table1 where id = 1');

    statement = sqb.delete().from('table1').where(['id', 1]);
    result = statement.build();
    assert.equal(result.sql, 'delete from table1 where id = 1');
    done();
  });

  it('should serialize formal delete statement with raw', function(done) {
    let statement = sqb.delete(sqb.raw('table1')).where(['id', 1]);
    let result = statement.build();
    assert.equal(result.sql, 'delete from table1 where id = 1');

    statement = sqb.delete().from(sqb.raw('a')).where(['id', 1]);
    result = statement.build();
    assert.equal(result.sql, 'delete from a where id = 1');
    done();
  });

  it('should serialize formal delete statement test-1', function(done) {
    let statement = sqb.delete(sqb.raw('table1'))
        .where(
            ['id', 1],
            ['field2', 2],
            ['field3',3],
            ['field4',4],
            ['field5',5],
            ['field6',6],
            ['field7',7],
            ['field8',8],
            ['field9',9]
        );
    let result = statement.build();
    assert.equal(result.sql, 'delete from table1 where id = 1 and field2 = 2 and field3 = 3 and field4 = 4 and field5 = 5 and field6 = 6 and field7 = 7 and field8 = 8 and field9 = 9');

    done();
  });
});