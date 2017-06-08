/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Waterfall', function() {

  it('should waterfall success', function(done) {
    sqb.waterfall([
      function(callback) {
        callback(null, 1, 2);
      },
      function(arg1, arg2, callback) {
        callback(null, arg1 + arg2);
      },
      function(arg1, callback) {
        callback(null, arg1, 10);
      }
    ], function(err, result1, result2) {
      assert.ok(!err);
      assert.equal(result1, 3);
      assert.equal(result2, 10);
      done();
    });

  });

});