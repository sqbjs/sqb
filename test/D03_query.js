/* eslint-disable */
const assert = require('assert');
const sqb = require('../');

describe('Query', function() {

  var pool;
  before(function() {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      pool: {
        validate: true,
        min: 1
      }
    });
  });

  after(function() {
    pool.close(true);
  });

  it('should hook for query execution', function(done) {
    var ok;
    pool.select().from('airports')
        .hook('execute', function(next) {
          ok = 1;
          next();
        })
        .execute(function(err, result) {
          done(err);
        });
  });

  it('should not continue execution if error in hook callback', function(done) {
    pool.select().from('airports')
        .hook('execute', function(next) {
          next(new Error('any error'));
        })
        .execute(function(err, result) {
          if (!err)
            return done(new Error('Failed'));
          done();
        });
  });

  it('should query hook validate arguments', function() {
    try {
      pool.select().from('airports')
          .hook(1, function() {
          });
    } catch (e) {
      try {
        pool.select().from('airports')
            .hook('aa', 1);
      } catch (e) {
        return;
      }
    }
    assert(0, 'Failed');
  });

  it('should validate if query is executable', function() {
    try {
      sqb.select().from('airports').execute();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('shutdown pool', function(done) {
    pool.close(function() {
      if (!pool.isClosed)
        return done(new Error('Failed'));
      done();
    });
  });

});