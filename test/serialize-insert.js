/* eslint-disable */
const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert statements', function () {

    it('should serialize formal insert statement with Object values', function (done) {
        let statement = sqb.insert('id', 'name').into().into('table1').values().values({id: 1, name: 'aaa'});
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name) values (1, 'aaa')");

        statement = sqb.insert().columns('id', 'name').into('table1').values({id: 1, name: 'aaa'});
        result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name) values (1, 'aaa')");
        done();
    });

    it('should serialize formal insert statement with Array values', function (done) {
        let statement = sqb.insert('id', 'name', 'address').into('table1').values([1, 'aaa']);
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name, address) values (1, 'aaa', null)");
        done();
    });

    it('should skip empty columns', function (done) {
        let statement = sqb.insert('id', 'name').columns().columns(undefined).into('table1').values({
            id: 1,
            name: 'aaa'
        });
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name) values (1, 'aaa')");
        done();
    });

    it('should serialize params in "values"', function (done) {
        let statement = sqb.insert('id', 'name').into('table1').values({id: /id/, name: /name/});
        let result = statement.build({}, {id: 1, name: 'aaa'});
        assert.equal(result.sql, "insert into table1 (id, name) values (?, ?)");
        assert.deepEqual(result.params, [1, 'aaa']);
        done();
    });

    it('should serialize named params', function (done) {
        let statement = sqb.insert('id', 'name').into('table1').values({id: /id/, name: /name/});
        let result = statement.build({
            namedParams: true,
            params: {ID: 1, NAME: 'aaa'}
        });
        assert.equal(result.sql, "insert into table1 (id, name) values (:ID, :NAME)");
        assert.deepEqual(result.params, {ID: 1, NAME: 'aaa'});
        done();
    });

    it('should serialize array params', function (done) {
        let statement = sqb.insert('id', 'name', 'address').into('table1').values([/id/, 'name', /address/]);
        let result = statement.build({}, [1, 'earth']);
        assert.equal(result.sql, "insert into table1 (id, name, address) values (?, 'name', ?)");
        assert.deepEqual(result.params, [1, 'earth']);
        done();
    });

    it('should serialize params in configuration (build.params)  ', function (done) {
        let statement = sqb.insert('id', 'name').into('table1').values([/id/, /name/]);
        let result = statement.build({
            params: {id: 1, name: 'aaa'}
        });
        assert.equal(result.sql, "insert into table1 (id, name) values (?, ?)");
        assert.deepEqual(result.params, [1, 'aaa']);
        done();
    });

    it('should serialize Raw in table name', function (done) {
        let statement = sqb.insert('id', 'name').into(sqb.raw('table1')).values({id: 1, name: 'aaa'});
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name) values (1, 'aaa')");
        done();
    });

    it('should serialize insert/select statement', function (done) {
        let statement = sqb.insert('ID', 'NAME').into('table1').values(
            sqb.select('id', 'name').from('table2').where(['id', '>', 5])
        );
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (ID, NAME) select id, name from table2 where id > 5");
        done();
    });

    it('should check arguments in .values()', function (done) {
        let ok;
        try {
            sqb.insert('id', 'name').into(sqb.raw('table1')).values(1);
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

});