/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../lib/index');

function readStream(stream, callback) {
  let bytes = new Buffer('');
  stream.on('data', (chunk) => bytes = Buffer.concat([bytes, chunk]));

  stream.on('end', () => {
    try {
      callback(null, bytes.toString());
    } catch (err) {
      callback(err);
    }
  });
}

describe('RowsetStream', function() {

  let pool;
  before(() => {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      defaults: {
        rowset: true
      }
    });
  });

  after(() => {
    pool.close();
  });

  it('test outFormat = 0', function(done) {
    this.slow(150);
    pool.select().from('airports').execute({
      fetchRows: 10
    }, (err, result) => {
      let stream;
      try {
        assert(!err, err);
        stream = result.rowset.toStream();
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
          assert(Array.isArray(obj));
          assert.equal(obj.length, 10);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('test outFormat = 1', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, (err, result) => {
      let stream;
      try {
        assert(!err, err);
        stream = result.rowset.toStream({outFormat: 1});
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
          assert.equal(obj.numRows, 10);
          assert(Array.isArray(obj.rows));
          assert(obj.fields);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  it('test objectMode = true', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, (err, result) => {
      let stream;
      try {
        assert(!err, err);
        stream = result.rowset.toStream({objectMode: true});
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
      stream.on('data', (chunk) => {
        arr.push(chunk);
      });

      stream.on('end', () => {
        try {
          assert.equal(arr.length, 10);
          assert.equal(arr[0].data[0], 'LFOI');
        } catch (e) {
          return done(e);
        }
        done();
      });
    });
  });

  describe('Finalize', function() {
    it('shutdown pool', (done) => pool.close(done));
  });

});