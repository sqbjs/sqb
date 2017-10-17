/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize update query', function() {

  it('should serialize formal update query', function(done) {
    var query = sqb.update('table1').set({
      NAME: 'name',
      ADDRESS: 'earth'
    }).where(['id', 1]);
    var result = query.generate();
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\' where id = 1');
    done();
  });

  it('should serialize formal update query without where clause', function(done) {
    var query = sqb.update('table1').set({
      NAME: 'name',
      ADDRESS: 'earth'
    }).where();
    var result = query.generate();
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\'');
    done();
  });

  it('should serialize params', function(done) {
    var query = sqb.update('table1').set({
      NAME: /name/,
      ADDRESS: /earth/
    }).where(['id', /id/]);
    var result = query.generate(undefined,
        {
          id: 1,
          name: 'name',
          address: 'earth'
        });
    assert.equal(result.sql, 'update table1 set NAME = ?, ADDRESS = ? where id = ?');
    done();
  });

  it('should use Raw in table', function(done) {
    var query = sqb.update(sqb.raw('table1')).set({
      NAME: 'name',
      ADDRESS: 'earth'
    }).where(['id', 1]);

    var result = query.generate();
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\' where id = 1');
    done();
  });

  it('should use Raw in values', function(done) {
    var query = sqb.update('table1')
        .set(sqb.raw('NAME = \'name\', ADDRESS = \'earth\''))
        .where(['id', 1]);
    var result = query.generate();
    assert.equal(result.sql, 'update table1 set NAME = \'name\', ADDRESS = \'earth\' where id = 1');
    done();
  });

  it('should check invalid argument for in "set"', function(done) {
    var ok;
    try {
      sqb.update('table1').set(1).where();
    } catch (e) {
      ok = true;
    }

    assert.ok(ok);
    done();
  });

  it('should pretty print', function(done) {
    var query = sqb.update('table1').set({
      name: 'name',
      address: 'earth'
    }).where(['id', 1]);
    var result = query.generate({
      prettyPrint: true
    });
    assert.equal(result.sql, 'update table1 set\n' +
        '  name = \'name\',\n' +
        '  address = \'earth\'\n' +
        'where id = 1');
    done();
  });

});