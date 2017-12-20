/* eslint-disable */
const assert = require('assert');
const sqb = require('../lib/index');

describe('FieldCollection', function() {

  var pool;
  before(function() {
    pool = new sqb.Pool({
      dialect: 'test',
      user: 'user',
      schema: 'schema',
      defaults: {
        rowset: true,
        fetchRows: 10
      }
    });
  });

  after(function() {
    pool.close(true);
  });

  it('should initialize FieldCollection', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      assert(fields);
      assert(fields.items);
      assert(fields.length);
      done();
    });
  });

  it('should initialize FieldCollection (options.naming = lowercase)', function(done) {
    pool.select().from('airports').execute({
      naming: 'lowercase'
    }, function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      assert(fields);
      assert.equal(fields.get(1).name, 'shortname');
      done();
    });
  });

  it('should initialize FieldCollection (options.naming = uppercase)', function(done) {
    pool.select().from('airports').execute({
      naming: 'uppercase'
    }, function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      assert(fields);
      assert.equal(fields.get(1).name, 'SHORTNAME');
      done();
    });
  });

  it('should get field index', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      assert.equal(fields.indexOf('id'), 0);
      assert.equal(fields.indexOf('shortname'), 1);
      assert.equal(fields.indexOf('invalid'), -1);
      done();
    });
  });

  it('should get field object', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      assert.equal(fields.get('id').name, 'ID');
      assert.equal(fields.get('ID').name, 'ID');
      assert.equal(fields.get(0).name, 'ID');
      assert.equal(fields.get(100), undefined);
      done();
    });
  });

  it('should convert to array of fields', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const arr = fields.toArray();
      assert(Array.isArray(arr));
      assert(arr.length);
      assert.equal(arr[1].name, 'ShortName');
      done();
    });
  });

  it('should convert to array of fields with lowercase names', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const arr = fields.toArray({naming: 'lowercase'});
      assert(Array.isArray(arr));
      assert(arr.length);
      assert.equal(arr[0].name, 'id');
      done();
    });
  });

  it('should convert to array of fields with uppercase names', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const arr = fields.toArray({naming: 'uppercase'});
      assert(Array.isArray(arr));
      assert(arr.length);
      assert.equal(arr[1].name, 'SHORTNAME');
      done();
    });
  });

  it('should convert to array of fields with original names', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const arr = fields.toArray({naming: 'invalidvalue'});
      assert(Array.isArray(arr));
      assert(arr.length);
      assert.equal(arr[1].name, 'ShortName');
      done();
    });
  });

  it('should convert to object of fields', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const obj = fields.toObject();
      assert(!Array.isArray(obj));
      assert(obj.ShortName);
      done();
    });
  });

  it('should convert to object of fields with lowercase names', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const obj = fields.toObject({naming: 'lowercase'});
      assert(!Array.isArray(obj));
      assert(obj.id);
      done();
    });
  });

  it('should convert to object of fields with uppercase names', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const obj = fields.toObject({naming: 'uppercase'});
      assert(!Array.isArray(obj));
      assert(obj.SHORTNAME);
      done();
    });
  });

  it('should convert to object of fields with original names', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const obj = fields.toObject({naming: 'invalidvalue'});
      assert(!Array.isArray(obj));
      assert(obj.ShortName);
      done();
    });
  });

  it('should toJSON() convert to object of fields', function(done) {
    pool.select().from('airports').execute(function(err, result) {
      assert(!err, err);
      const fields = result && result.rowset.fields;
      const obj = fields.toJSON();
      assert(!Array.isArray(obj));
      assert(obj.ShortName);
      done();
    });
  });

  describe('Finalize', function() {
    it('shutdown pool', function(done) {
      pool.close(done);
    });
  });

});