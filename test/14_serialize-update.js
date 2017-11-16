/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize update query', function() {

  var serializer;

  before(function() {
    serializer = new sqb.serializer({
      dialect: 'test',
      prettyPrint: false
    });
  });

  it('should serialize formal update query', function() {
    var query = sqb.update('table1').set({
      NAME: 'name',
      ADDRESS: 'earth'
    }).where(['id', 1]);
    var result = serializer.generate(query);
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\' where id = 1');
  });

  it('should serialize formal update query without where clause', function() {
    var query = sqb.update('table1').set({
      NAME: 'name',
      ADDRESS: 'earth'
    }).where();
    var result = serializer.generate(query);
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\'');
  });

  it('should serialize params', function() {
    var query = sqb.update('table1').set({
      NAME: /name/,
      ADDRESS: /earth/
    }).where(['id', /id/]);
    var result = serializer.generate(query,
        {
          id: 1,
          name: 'name',
          address: 'earth'
        });
    assert.equal(result.sql, 'update table1 set NAME = :NAME, ADDRESS = :ADDRESS where id = :id');
  });

  it('should use Raw in table', function() {
    var query = sqb.update(sqb.raw('table1')).set({
      NAME: 'name',
      ADDRESS: 'earth'
    }).where(['id', 1]);

    var result = serializer.generate(query);
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\' where id = 1');
  });

  it('should use Raw in values', function() {
    var query = sqb.update('table1')
        .set(sqb.raw('NAME = \'name\', ADDRESS = \'earth\''))
        .where(['id', 1]);
    var result = serializer.generate(query);
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\' where id = 1');
  });

  it('should check invalid argument for in "set"', function() {
    try {
      sqb.update('table1').set(1).where();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('should pretty print', function() {
    var query = sqb.update('table1').set({
      name: 'name',
      address: 'earth'
    }).where(['id', 1])
        .returning({
          id: 'string'
        });
    var result = query.generate();
    assert.equal(result.sql, 'update table1 set\n' +
        '  name = \'name\',\n' +
        '  address = \'earth\'\n' +
        'where id = 1\n' +
        'returning id');
  });

  it('should validate returning() arguments', function() {
    try {
      sqb.update('table1').set({
        name: 'name',
        address: 'earth'
      }).returning(1234);
    } catch (e) {
      sqb.update('table1').set({
        name: 'name',
        address: 'earth'
      }).returning(null);
      return;
    }
    assert(0, 'Failed');
  });

  it('should validate returning() data types', function() {
    try {
      sqb.update('table1').set({
        name: 'name',
        address: 'earth'
      }).returning({id: 'invalid'});
    } catch (e) {
      sqb.update('table1').set({
        name: 'name',
        address: 'earth'
      }).returning({id: 'string'});
      return;
    }
    assert(0, 'Failed');
  });

});