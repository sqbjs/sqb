const assert = require('assert'),
    sqb = require('../');

describe('Serialize insert statements', function () {


    it('should serialize formal insert statement', function (done) {
        let statement = sqb.insert('id', 'name').into('table1').values({id: 1, name: 'aaa'});
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name) values (1, 'aaa')");
        done();
    });

    it('should serialize params in "values"', function (done) {
        let statement = sqb.insert(/id/, /name/).into('table1').values({id: 1, name: 'aaa'});
        let result = statement.build();
        assert.equal(result.sql, "insert into table1 (id, name) values (:ID, :NAME)");
        assert.deepEqual(result.params, { ID: 1, NAME: 'aaa' });
        done();
    });

    it('should serialize indexed params', function (done) {
        let statement = sqb.insert(/id/, /name/).into('table1').values({id: 1, name: 'aaa'});
        let result = statement.build({
            namedParams: false
        });
        assert.equal(result.sql, "insert into table1 (id, name) values (?, ?)");
        assert.deepEqual(result.params, [ 1, 'aaa' ]);
        done();
    });

    it('should serialize params in configuration (build.params)  ', function (done) {
        let statement = sqb.insert(/id/, /name/).into('table1');
        let result = statement.build({
            params: {id: 1, name: 'aaa'}
        });
        assert.equal(result.sql, "insert into table1 (id, name) values (:ID, :NAME)");
        assert.deepEqual(result.params, { ID: 1, NAME: 'aaa' });
        done();
    });

});