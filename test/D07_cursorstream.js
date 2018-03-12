/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');
const testAdapter = require('./support/test_adapter');
const airports = testAdapter.data.airports;

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
        cursor: true
      }
    });
  });

  after(() => pool.close(true));
  after(() => pool.close(true));

  it('test outFormat = 0', function(done) {
    this.slow(200);
    pool.select().from('airports').execute((err, result) => {
      let stream;
      try {
        assert(!err, err);
        stream = result.cursor.toStream();
        assert(stream);
        assert.equal(stream.inspect(), '[object CursorStream]');
      } catch (e) {
        return done(e);
      }
      stream.on('fields', (fields) => {
        try {
          assert(fields.ID);
        } catch (e) {
          return done(e);
        }
      });
      readStream(stream, (err, buf) => {
        if (err)
          return done(err);
        try {
          const obj = JSON.parse(buf);
          assert(Array.isArray(obj));
          assert.equal(obj.length, airports.arr.length);
          assert(stream.isClosed);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('test outFormat = 1', function(done) {
    this.slow(200);
    pool.select().from('airports').execute((err, result) => {
      let stream;
      try {
        assert(!err, err);
        stream = result.cursor.toStream({outFormat: 1});
        assert(stream);
      } catch (e) {
        return done(e);
      }
      stream.on('fields', (fields) => {
        try {
          assert(fields.ID);
        } catch (e) {
          return done(e);
        }
      });
      readStream(stream, (err, buf) => {
        if (err)
          return done(err);
        try {
          const obj = JSON.parse(buf);
          assert(!Array.isArray(obj));
          assert.equal(obj.numRows, airports.arr.length);
          assert(Array.isArray(obj.rows));
          assert(obj.fields);
          assert(stream.isClosed);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('test objectMode = true', function(done) {
    pool.select().from('airports').execute((err, result) => {
      let stream;
      try {
        assert(!err, err);
        stream = result.cursor.toStream({objectMode: true});
        assert(stream);
      } catch (e) {
        return done(e);
      }
      const arr = [];
      stream.on('fields', (fields) => {
        try {
          assert(fields.ID);
        } catch (e) {
          return done(e);
        }
      });
      stream.on('data', (chunk) => arr.push(chunk));

      stream.on('end', () => {
        try {
          assert.equal(arr.length, airports.arr.length);
          assert.equal(arr[0][0], 'LFOI');
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('should cursor.close emit stream close event', function(done) {
    pool.select().from('airports').execute((err, result) => {
      const stream = result.cursor.toStream();
      stream.on('close', () => {
        done();
      });
      result.cursor.close();
    });
  });

  it('should stream.close also close the cursor', function(done) {
    pool.select().from('airports').execute((err, result) => {
      const stream = result.cursor.toStream();
      result.cursor.on('close', () => {
        done();
      });
      stream.close();
    });
  });

  it('should handle error on cursor close', function(done) {
    pool.select().from('airports').execute((err, result) => {
      const stream = result.cursor.toStream();
      result.cursor.close = (cb) => {
        cb(new Error('Any error'));
      };
      stream.on('error', (fields) => {
        delete result.cursor.close;
        stream.close();
        done();
      });
      stream.close((err) => {});
    });
  });

  it('should handle error on cursor fetch', function(done) {
    pool.select().from('airports').execute((err, result) => {
      const stream = result.cursor.toStream();
      result.cursor.next = (cb) => {
        cb(new Error('Any error'));
      };
      stream.once('error', () => {
        stream.close(done);
      });
      readStream(stream, () => {});
    });
  });

  describe('Finalize', function() {
    it('shutdown pool', (done) => {
      pool.close(done);
    });
  });

});