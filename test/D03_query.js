/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../');

describe('Query', () => {

  let pool;
  before(() => {
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

  after(() => {
    pool.close(true);
  });

  it('should hook for query execution', function(done) {
    let ok;
    pool.select().from('airports')
        .hook('execute', (next) => {
          ok = 1;
          next();
        })
        .execute((err) => {
          done(err);
        });
  });

  it('should not continue execution if error in hook callback', function(done) {
    pool.select().from('airports')
        .hook('execute', (next) => next(new Error('any error')))
        .execute((err, result) => {
          if (!err)
            return done(new Error('Failed'));
          done();
        });
  });

  it('should query hook validate arguments', () => {
    try {
      pool.select().from('airports')
          .hook(1, () => {
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

  it('should validate if query is executable', () => {
    try {
      sqb.select().from('airports').execute();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  it('shutdown pool', function(done) {
    pool.close(() => {
      if (!pool.isClosed)
        return done(new Error('Failed'));
      done();
    });
  });

});