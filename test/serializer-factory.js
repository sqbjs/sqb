
const assert = require('assert'),
    sqb = require('../');

describe('Initialize serializer', function () {

    it('should initialize generic serializer', function (done) {
        let obj = sqb.serializer();
        assert.ok(obj instanceof sqb.Serializer);
        done();
    });

    it('should initialize "oracle" dialect', function (done) {
        let obj = sqb.serializer('oracle');
        assert.ok(obj instanceof sqb.Serializer);
        assert.equal(obj.dialect, 'oracle');
        done();
    });

    it('should initialize "oracledb" dialect', function (done) {
        let obj = sqb.serializer({dialect: 'oracledb'});
        assert.ok(obj instanceof sqb.Serializer);
        assert.equal(obj.dialect, 'oracle');
        done();
    });

    it('should return serializer that already passed in first argument', function (done) {
        let obj = sqb.serializer('oracle');
        let obj2 = sqb.serializer(obj);
        assert.ok(obj === obj2);
        done();
    });

});