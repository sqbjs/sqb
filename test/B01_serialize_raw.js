/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../');

describe('serialize "Raw"', ()=> {

  let options = {
    prettyPrint: false
  };

  it('should initialize Raw', ()=> {
    assert(sqb.raw().isRaw);
  });

  it('should serialize Raw', ()=> {
    let query = sqb.select(sqb.raw('\'John\'\'s Bike\' f1'))
        .from('table1');
    let result = query.generate(options);
    assert.equal(result.sql, 'select \'John\'\'s Bike\' f1 from table1');
  });

});
