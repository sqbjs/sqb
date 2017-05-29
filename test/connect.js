/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');


describe('Connect', function () {


    let db;

    describe('DbPool', function () {

        it('should register dialect', function (done) {
            require('./support/test_pool');
            done();
        });

        it('should get registered DbPool', function (done) {
            assert.ok(sqb.DbPool.get('testdb'));
            done();
        });

        it('should create DbPool', function (done) {
            assert.ok(sqb.DbPool.create('testdb'));
            assert.ok(sqb.DbPool.create('generic'));
            done();
        });

        it('should create db pool', function (done) {

            db = sqb.pool({
                dialect: 'testdb',
                user: 'user',
                schema: 'schema'
            });
            assert.ok(db);
            assert.equal(db.dialect, 'testdb');
            assert.equal(db.user, 'user');
            assert.equal(db.schema, 'schema');
            done();
        });

        it('should execute statement', function (done) {

            db.select('ID', 'ADI').from('ULKE').identify('aaaaa').then(result => {
                assert.deepEqual(result.rows, [[1, 'a'], [2, 'b']]);
                done();
            }).catch(err => {
                done(new Error(err));
            });

        });

        it('should create connection', function (done) {

            db.connect((conn, close) => {
                done();
            }).catch(err => {
                done(new Error(err));
            });

        });

        it('should create connection', function (done) {

            db.connect((conn, close) => {
                done();
            }).catch(err => {
                done(new Error(err));
            });

        });
    });

    describe('DbPool', function () {

        it('should execute sql', function (done) {

            db.connect((conn, close) => {
                conn.execute('select * from test', [], {
                    autoCommit: true,
                    extendedMetaData: true,
                    prefetchRows: 1,
                    maxRows: 5,
                    resultSet: false,
                    objectRows: false,
                    showSql: false
                }).then(result => {
                    assert.deepEqual(result.rows, [[1, 'a'], [2, 'b']]);
                    close();
                    done();
                }).catch(err => {
                    close();
                    done(new Error(err));
                });

            }).catch(err => {
                close();
                done(new Error(err));
            });

        });

    });

});