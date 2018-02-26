/* eslint-disable */
const assert = require('assert'),
    sqb = require('../'),
    Op = sqb.Op;

describe('Hooking serialization', function() {

  var options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should hook serialization', function() {
    var query = sqb.select()
        .from('table1')
        .hook('serialize', function(ctx, type, o, defFn) {
          if (type === 'table_name')
            return 'table2';
        });
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table2');
  });

  it('should continue serialization with modified options', function() {
    var query = sqb.select()
        .from('table1')
        .where(Op.eq('id', 1))
        .hook('serialize', function(ctx, type, o, defFn) {
          if (type === 'operator')
            o.expression = 'new_id';
        });
    var result = query.generate(options);
    assert.equal(result.sql, 'select * from table1 where new_id = 1');
  });

});