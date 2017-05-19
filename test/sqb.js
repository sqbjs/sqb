
const assert = require('assert'),
    sqb = require('../');


describe('Initialize sql objects', function () {

    it('should initialize "raw"', function (done) {
        let obj = sqb.raw('test');
        assert.ok(obj instanceof sqb.Raw);
        assert.equal(obj.type, 'raw');
        done();
    });

    it('should initialize "select"', function (done) {
        let obj = sqb.select('id');
        assert.ok(obj instanceof sqb.Select);
        assert.equal(obj.type, 'select');
        done();
    });

    it('should initialize "column"', function (done) {
        let obj = sqb.column('id');
        assert.equal(obj.type, 'column');
        assert.ok(obj instanceof sqb.Column);
        done();
    });

    it('should validate arguments in "join"', function (done) {
        let ok;
        try {
            new sqb.Join(sqb.Join.Type.innerJoin, 1);
            new sqb.Join(-1, 'table');
            new sqb.Join(7, 'table');
        } catch (e) {
            ok = 1;
        }
        if (ok) done(); else assert.ok(0);
    });

    it('should initialize "join"', function (done) {
        let obj = sqb.join('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.innerJoin, obj.joinType);
        done();
    });

    it('should initialize "innerJoin"', function (done) {
        let obj = sqb.innerJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.innerJoin, obj.joinType);
        done();
    });

    it('should initialize "leftJoin"', function (done) {
        let obj = sqb.leftJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.leftJoin, obj.joinType);
        done();
    });

    it('should initialize "leftOuterJoin"', function (done) {
        let obj = sqb.leftOuterJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.leftOuterJoin, obj.joinType);
        done();
    });

    it('should initialize "rightJoin"', function (done) {
        let obj = sqb.rightJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.rightJoin, obj.joinType);
        done();
    });

    it('should initialize "rightOuterJoin"', function (done) {
        let obj = sqb.rightOuterJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.rightOuterJoin, obj.joinType);
        done();
    });

    it('should initialize "outerJoin"', function (done) {
        let obj = sqb.outerJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.outerJoin, obj.joinType);
        done();
    });

    it('should initialize "fullOuterJoin"', function (done) {
        let obj = sqb.fullOuterJoin('table');
        assert.ok(obj instanceof sqb.Join);
        assert.equal(obj.type, 'join');
        assert.equal(sqb.Join.Type.fullOuterJoin, obj.joinType);
        done();
    });

    it('should initialize "or"', function (done) {
        let obj = sqb.or('field', '=', 1);
        assert.ok(obj instanceof sqb.Condition);
        assert.equal(obj.logicalOperator, 'or');
        assert.equal(obj.type, 'condition');
        assert.equal(obj.field, 'field');
        assert.equal(obj.operator, '=');
        assert.equal(obj.value, 1);

        obj = sqb.and('field', 1);
        assert.equal(obj.field, 'field');
        assert.equal(obj.operator, '=');
        assert.equal(obj.value, 1);
        done();
    });

    it('should initialize "and"', function (done) {

        let obj = sqb.and('field', '=', 1);
        assert.ok(obj instanceof sqb.Condition);
        assert.equal(obj.logicalOperator, 'and');
        assert.equal(obj.type, 'condition');
        assert.equal(obj.field, 'field');
        assert.equal(obj.operator, '=');
        assert.equal(obj.value, 1);

        obj = sqb.and('field', 1);
        assert.equal(obj.field, 'field');
        assert.equal(obj.operator, '=');
        assert.equal(obj.value, 1);

        done();
    });


});