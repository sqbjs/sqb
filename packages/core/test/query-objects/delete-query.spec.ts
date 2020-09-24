import assert from 'assert';
import {Delete, Raw, SerializationType, Eq} from '../../src';

describe('Serialize delete query', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize DeleteQuery', function () {
        const q = Delete('table1');
        assert.strictEqual(q && q._type, SerializationType.DELETE_QUERY);
    });

    it('should serialize delete', function () {
        const query = Delete('table1')
            .where(Eq('id', 1));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'delete from table1 where id = 1');
    });

    it('should pass raw as table name', function () {
        const query = Delete(Raw('table1'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'delete from table1');
    });

    it('should validate first (tableName) argument', function () {
        assert.throws(() => Delete(null),
            /required as first argument/);
    });

});
