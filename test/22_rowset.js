/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');

describe('Rowset', function() {

  var pool;
  before(function() {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      defaults: {
        rowset: true
      }
    });
  });

  after(function() {
    pool.close(true);
  });

  it('should return Rowset for select queries', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        assert(result && result.rowset);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should return Rowset for select queries - Promise - 1', function() {
    const promise = pool.select().from('airports').then();
    return promise.then(function(result) {
      assert(result && result.rowset);
    });
  });

  it('should return Rowset for select queries - Promise - 2', function() {
    return pool.select().from('airports').then(function(result) {
      assert(result && result.rowset);
    });
  });

  it('should rowset.rows property return Array of row objects', function() {
    const promise = pool.select().from('airports').then();
    return promise.then(function(result) {
      const rowset = result && result.rowset;
      assert(rowset);
      assert(Array.isArray(rowset.rows));
    });
  });

  it('should rowset.length property return Row count', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        assert.equal(result.rowset.length, 10);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should rowset.fields property return FieldCollection', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert(rowset.fields);
        assert(rowset.fields.get('id'));
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should set rowset.rowNum property', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        rowset.on('move', function() {
          if (rowset.rowNum === 3)
            done();
        });
        assert.equal(rowset.isBof, true);
        rowset.rowNum = 5;
        assert.equal(rowset.row[0], rowset.rows[4][0]);
        rowset.rowNum = 3;
      } catch (e) {
        return done(e);
      }
    });
  });

  it('should not set rowset.rowNum negative value', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.rowNum = -1;
        assert.equal(rowset.rowNum, 0);
        assert.equal(rowset.isBof, true);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should not set rowset.rowNum more than length+1', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.rowNum = 100;
        assert.equal(rowset.rowNum, 11);
        assert.equal(rowset.isEof, true);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should fetch object rows (options.naming = lowercase)', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10,
      objectRows: true,
      naming: 'lowercase'
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert(rowset.fields);
        assert.equal(rowset.fields.get(0).name, 'id');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should fetch object rows (options.naming = uppercase)', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10,
      objectRows: true,
      naming: 'uppercase'
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert(rowset.fields);
        assert.equal(rowset.fields.get(0).name, 'ID');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should fetch object rows (options.ignoreNulls = true)', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10,
      objectRows: true,
      ignoreNulls: true
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert.equal(rowset.rows[0].TestNoValue, undefined);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should fetch object rows (options.fetchAsString = [Date])', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10,
      objectRows: true,
      fetchAsString: [Date]
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert.equal(typeof rowset.rows[0].get('datevalue'), 'string');
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should iterate over rows', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert.equal(rowset.isBof, true);
        var k = 0;
        // noinspection JSAnnotator
        for (var o of rowset) {
          assert.equal(o, rowset.rows[k]);
          assert.equal(o, rowset.row);
          k++;
        }
        assert.equal(rowset.isEof, true);
        assert.equal(rowset.next(), undefined);
        assert.equal(k, 10);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should next() iterate over rows', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert.equal(rowset.isBof, true);
        var k = 0;
        var o;
        while ((o = rowset.next())) {
          assert.equal(rowset.row, rowset.rows[k]);
          assert.equal(rowset.rowNum, k + 1);
          k++;
        }
        assert.equal(rowset.isEof, true);
        assert.equal(rowset.next(), undefined);
        assert.equal(k, 10);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should next() iterate over rows (objectRows = true)', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10,
      objectRows: true
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert.equal(rowset.isBof, true);
        var k = 0;
        var o;
        while ((o = rowset.next())) {
          assert.equal(rowset.row, rowset.rows[k]);
          assert.equal(rowset.rowNum, k + 1);
          k++;
        }
        assert.equal(rowset.isEof, true);
        assert.equal(k, 10);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should prev() iterate over rows', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        var k = 10;
        var o;
        rowset.rowNum = 100;
        assert.equal(rowset.isEof, true);
        while ((o = rowset.prev())) {
          k--;
          assert.equal(rowset.row, rowset.rows[k]);
          assert.equal(rowset.rowNum, k + 1);
        }
        assert.equal(rowset.isBof, true);
        assert.equal(rowset.prev(), undefined);
        assert.equal(k, 0);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should seek() move current row', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert.equal(rowset.rowNum, 0);
        rowset.seek(5);
        assert.equal(rowset.rowNum, 5);
        rowset.seek(-1);
        assert.equal(rowset.rowNum, 4);
        rowset.seek(-1);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should reset() move cursor to bof', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.rowNum = 100;
        rowset.reset();
        assert.equal(rowset.rowNum, 0);
        assert.equal(rowset.isBof, true);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should set moveTo() move cursor to given row', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        assert(rowset);
        assert.equal(rowset.isBof, true);
        assert.equal(rowset.moveTo(5), 5);
        assert.equal(rowset.row, rowset.rows[4]);
        assert.equal(rowset.moveTo(), 0);
        assert.equal(rowset.moveTo(100000), rowset.length + 1);
        assert.equal(rowset.moveTo(-1), 0);
        assert.equal(rowset.rowNum, 0);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should get() return field value', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.next();
        assert.equal(rowset.get('id'), 'LFOI');
        assert.equal(rowset.get('TestNoValue'), null);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should get() return field value (objectRows = true)', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10,
      objectRows: true
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.next();
        assert.equal(rowset.get('id'), 'LFOI');
        assert.equal(rowset.get('TestNoValue'), null);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should get() throw error when unknown field given', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      const rowset = result && result.rowset;
      rowset.next();
      try {
        rowset.get('noid');
      } catch (e) {
        return done();
      }
      done(new Error('Failed'));
    });
  });

  it('should get() throw error when BOF', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      const rowset = result && result.rowset;
      try {
        rowset.get('id');
      } catch (e) {
        return done();
      }
      done(new Error('Failed'));
    });
  });

  it('should get() throw error when EOF', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      const rowset = result && result.rowset;
      rowset.rowNum = 999999;
      try {
        rowset.get('id');
      } catch (e) {
        return done();
      }
      done(new Error('Failed'));
    });
  });

  it('should set() update field value', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.next();
        const d = Date.now();
        rowset.rowNum = 100;
        rowset.set('TestNoValue', d);
        assert.equal(rowset.get('TestNoValue'), d);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should set() update field value - (objectRows = true)', function(done) {
    pool.select().from('airports').execute({
      objectRows: true
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.next();
        rowset.rowNum = 99;
        const d = Date.now();
        assert.equal(rowset.set('TestNoValue', d), rowset);
        assert.equal(rowset.get('TestNoValue'), d);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should set() throw error when unknown field given', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      const rowset = result && result.rowset;
      try {
        rowset.next();
        rowset.set('noid');
      } catch (e) {
        return done();
      }
      done(new Error('Failed'));
    });
  });

  it('should set() throw error when BOF', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      const rowset = result && result.rowset;
      try {
        rowset.set('id', 1);
      } catch (e) {
        return done();
      }
      done(new Error('Failed'));
    });
  });

  it('should set() throw error when EOF', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      const rowset = result && result.rowset;
      rowset.next();
      rowset.rowNum = 99999;
      try {
        rowset.set('id', 1);
      } catch (e) {
        return done();
      }
      done(new Error('Failed'));
    });
  });

  it('should toJSON() return json representation of Rowset', function(done) {
    pool.select().from('airports').execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.next();
        const obj = rowset.toJSON();
        assert.equal(typeof obj, 'object');
        assert(!Array.isArray(obj));
        assert(obj.fields.ID);
        assert.equal(obj.rows[0].data[0], 'LFOI');
        assert.equal(obj.numRows, 10);
        assert.equal(obj.eof, true);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  it('should emit query.fetch event', function(done) {
    const query = pool.select().from('airports');
    query.on('fetch', function(row) {
      row.set('Flags', 123456);
    });
    query.execute({
      fetchRows: 10
    }, function(err, result) {
      try {
        assert(!err, err);
        const rowset = result && result.rowset;
        rowset.next();
        assert.equal(rowset.get('Flags'), 123456);
      } catch (e) {
        return done(e);
      }
      done();
    });
  });

  describe('Finalize', function() {
    it('shutdown pool', function(done) {
      pool.close(done);
    });
  });

});