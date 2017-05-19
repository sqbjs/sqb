
const assert = require('assert'),
    sqb = require('../');

describe('Initialize generator', function () {

    it('should initialize generic generator', function (done) {
        let obj = sqb.generator();
        assert.ok(obj instanceof sqb.Generator);
        done();
    });

    it('should initialize "oracle" dialect', function (done) {
        let obj = sqb.generator('oracle');
        assert.ok(obj instanceof sqb.Generator);
        assert.equal(obj.dialect, 'oracle');
        done();
    });

    it('should initialize "oracledb" dialect', function (done) {
        let obj = sqb.generator({dialect: 'oracledb'});
        assert.ok(obj instanceof sqb.Generator);
        assert.equal(obj.dialect, 'oracle');
        done();
    });

    it('should return generator that already passed in first argument', function (done) {
        let obj = sqb.generator('oracle');
        let obj2 = sqb.generator(obj);
        assert.ok(obj === obj2);
        done();
    });

});