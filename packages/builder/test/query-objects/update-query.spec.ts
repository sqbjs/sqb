import '../_support/env';
import assert from 'assert';
import {SerializationType, Update, Raw, Eq, Param} from '@sqb/builder';

describe('Serialize update query', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize UpdateQuery', function () {
        const q = Update('table1', {id: 1});
        assert.strictEqual(q && q._type, SerializationType.UPDATE_QUERY);
    });

    it('should serialize update', function () {
        const query = Update('table1', {id: 2, name: 'aaa'})
            .where(Eq('id', 1));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'update table1 set id = 2, name = \'aaa\' where id = 1');
    });

    it('should pass raw as table name', function () {
        const query = Update(Raw('table1'), {id: 2, name: 'aaa'})
            .where(Eq('id', 1));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'update table1 set id = 2, name = \'aaa\' where id = 1');
    });

    it('should validate first (tableName) argument', function () {
        assert.throws(() =>
                Update(null, {id: 1, name: 'aaa'}),
            /required as first argument/);
    });

    it('should validate second (values) argument', function () {
        assert.throws(() =>
                Update('table1', [1, 'aaa']),
            /instance required as second argument/);
        assert.throws(() =>
                Update('table1', 'sdfds'),
            /instance required as second argument/);
    });

    it('should serialize params with "values" argument: COLON', function () {
        const query = Update('table1', {id: Param('id'), name: Param('name')});
        const result = query.generate(Object.assign({
            values: {
                id: 1,
                name: 'abc'
            }, ...options
        }, options));
        assert.strictEqual(result.sql, 'update table1 set id = :id, name = :name');
        assert.deepStrictEqual(result.params, {
            id: 1,
            name: 'abc'
        });
    });

    it('should serialize params with query.params', function () {
        const query = Update('table1', {id: Param('id'), name: Param('name')})
            .values({
                id: 1,
                name: 'abc'
            });
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'update table1 set id = :id, name = :name');
        assert.deepStrictEqual(result.params, {
            id: 1,
            name: 'abc'
        });
    });

    it('should validate query.params', function () {
        assert.throws(() =>
                Update('table1', {id: Param('id'), name: /name/})
                    .values([1, 'abc']),
            /Invalid argument/);
    });

    it('should serialize update with returning', function () {
        const query = Update('table1', {id: 1, name: 'aaa'})
            .returning({'id': 'number', name: 'string'});
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'update table1 set id = 1, name = \'aaa\' returning id, name');
    });

    it('should validate returning() arguments', function () {

        assert.throws(() =>
                // @ts-ignore
                Update('table1', {id: 1, name: 'aaa'}).returning(1234),
            /Object argument required/);
        Update('table1', {id: 1, name: 'aaa'})
            .returning(null);
    });

    it('should validate returning() data types', function () {
        assert.throws(() =>
                Update('table1', {id: 1, name: 'aaa'})
                    .returning({id: 'invalid'}),
            /Unknown data type/);
        Update('table1', {id: 1, name: 'aaa'})
            .returning({id: 'string'});
    });

});