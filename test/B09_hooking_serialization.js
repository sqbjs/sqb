/* eslint-disable */
'use strict';

const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('Hooking serialization', function() {

  let options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should hook serialization', function() {
    const query = sqb.select()
        .from('table1')
        .on('serialize', function(ctx, type) {
          if (type === 'table_name')
            return 'table2';
        });
    const result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table2');
  });

  it('should continue serialization with modified options', function() {
    const query = sqb.select()
        .from('table1')
        .where(Op.eq('id', 1))
        .on('serialize', function(ctx, type, o) {
          if (type === 'comparison')
            o.expression = 'new_id';
        });
    const result = query.generate(options);
    assert.strictEqual(result.sql, 'select * from table1 where new_id = 1');
  });

});
