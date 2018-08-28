/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');
const testAdapter = require('./support/test_adapter');

function readStream(stream, callback) {
  let bytes = new Buffer('');
  stream.on('data', (chunk) => {
    bytes = Buffer.concat([bytes, chunk]);
  });

  stream.on('end', function() {
    try {
      callback(null, bytes.toString());
    } catch (err) {
      callback(err);
    }
  });
}

describe('CursorStream', function() {

  let pool;
  before(() => {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      defaults: {
        cursor: true,
        fetchRows: 10
      }
    });
  });

  after(() => pool.close(true));

  it('test outFormat = 0', function(done) {
    pool.select().from('airports').execute().then(result => {
      let stream;
      stream = result.cursor.toStream();
      assert(stream);
      assert.equal(String(stream), '[object CursorStream]');
      readStream(stream, (err, buf) => {
        if (err)
          return done(err);
        try {
          const obj = JSON.parse(buf);
          assert(Array.isArray(obj));
          assert.equal(obj.length, 10);
          assert(stream.isClosed);
        } catch (e) {
          return done(e);
        }
        done();
      });
    }).catch(err => done(err));
  });

  it('test outFormat = 1', function(done) {
    pool.select().from('airports').execute().then(result => {
      let stream;
      stream = result.cursor.toStream({outFormat: 1});
      assert(stream);
      assert.equal(String(stream), '[object CursorStream]');
      readStream(stream, (err, buf) => {
        if (err)
          return done(err);
        try {
          const obj = JSON.parse(buf);
          assert(!Array.isArray(obj));
          assert(obj.rows);
          assert.equal(obj.numRows, 10);
          assert.equal(obj.eof, true);
          assert.equal(obj.rows.length, 10);
          assert(stream.isClosed);
        } catch (e) {
          return done(e);
        }
        done();
      });
    }).catch(err => done(err));
  });

  it('test objectMode = true', function(done) {
    pool.select().from('airports').execute().then(result => {
      let stream;
      stream = result.cursor.toStream({objectMode: true});
      assert(stream);
      assert.equal(String(stream), '[object CursorStream]');
      const arr = [];
      stream.on('data', function(chunk) {
        arr.push(chunk);
      });
      stream.on('end', function() {
        try {
          assert.equal(arr.length, 10);
          assert.equal(arr[0].ID, 'LFOI');
        } catch (e) {
          return done(e);
        }
        done();
      });
    }).catch(err => done(err));
  });

  it('should cursor.close() also close the stream', function(done) {
    pool.select().from('airports').execute().then(result => {
      const stream = result.cursor.toStream();
      stream.on('close', () => done());
      result.cursor.close();
    }).catch(err => done(err));
  });

  it('should stream.close() also close the cursor', function(done) {
    pool.select().from('airports').execute().then(result => {
      const stream = result.cursor.toStream();
      result.cursor.on('close', () => done());
      stream.close().catch((err) => done(err));
    });
  });

  it('should handle cursor errors', function(done) {
    pool.select().from('airports').execute().then(result => {
      const stream = result.cursor.toStream();
      result.cursor._cursor.close = (cb) => cb(new Error('Any error'));
      stream.on('error', () => {
        delete result.cursor._cursor.close;
        stream.close().then(() => done());
      });
      stream.close().catch(() => 0);
    });
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