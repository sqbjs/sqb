/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize delete query', function() {

  var serializer;

  before(function() {
    serializer = new sqb.serializer({
      dialect: 'test',
      prettyPrint: false
    });
  });

  it('should serialize formal delete query without raw', function(done) {
    var query = sqb.delete('table1').where(['id', 1]);
    var result = serializer.generate(query);
    assert.equal(result.sql, 'delete from table1 where id = 1');

    query = sqb.delete().from('table1').where(['id', 1]);
    result = serializer.generate(query);
    assert.equal(result.sql, 'delete from table1 where id = 1');
    done();
  });

  it('should serialize formal delete query with raw', function(done) {
    var query = sqb.delete(sqb.raw('table1')).where(['id', 1]);
    var result = serializer.generate(query);
    assert.equal(result.sql, 'delete from table1 where id = 1');

    query = sqb.delete().from(sqb.raw('a')).where(['id', 1]);
    result = serializer.generate(query);
    assert.equal(result.sql, 'delete from a where id = 1');
    done();
  });

  it('should serialize formal delete query test-1', function(done) {
    var query = sqb.delete(sqb.raw('table1'))
        .where(
            ['id', 1],
            ['field2', 2],
            ['field3', 3],
            ['field4', 4],
            ['field5', 5],
            ['field6', 6],
            ['field7', 7],
            ['field8', 8],
            ['field9', 9]
        );
    var result = serializer.generate(query);
    assert.equal(result.sql, 'delete from table1 where id = 1 and field2 = 2 and field3 = 3 and field4 = 4 and field5 = 5 and field6 = 6 and field7 = 7 and field8 = 8 and field9 = 9');

    done();
  });
});