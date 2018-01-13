/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('serialize "Raw"', function() {

  var options = {
    prettyPrint: false
  };

  it('should initialize Raw', function() {
    assert(sqb.raw().isRaw);
  });

  it('should serialize Raw', function() {
    var query = sqb.select(sqb.raw('\'John\'\'s Bike\' f1'))
        .from('table1');
    var result = query.generate(options);
    assert.equal(result.sql, 'select \'John\'\'s Bike\' f1 from table1');
  });

});
