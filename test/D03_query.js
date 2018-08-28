/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');

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

  after(() => pool.close(true));

  it('should hook for query execution', function() {
    let ok;
    return pool.select().from('airports')
        .on('execute', () => {
          ok = 1;
        })
        .execute().then(() => {
          assert.equal(ok, 1);
        });
  });

  it('should not continue execution if error in hook callback', function(done) {
    pool.select().from('airports')
        .on('execute', (next) => next(new Error('any error')))
        .execute().then(() => {
      done(new Error('Failed'));
    }).catch(() => done());
  });

  it('should validate if query is executable', () => {
    try {
      sqb.select().from('airports').execute();
    } catch (e) {
      return;
    }
    assert(0, 'Failed');
  });

  describe('Finalize', function() {
    it('should have no active connection after all tests', function() {
      assert.equal(pool.acquired, 0);
    });

    it('should shutdown pool', function() {
      return pool.close().then(() => {
        if (!pool.isClosed)
          throw new Error('Failed');
      });
    });
  });

});