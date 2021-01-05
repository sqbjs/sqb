import '../_support/env';
import assert from 'assert';
import {DataType, Insert, Param, Raw, Select, SerializationType} from '@sqb/builder';

describe('Serialize insert query', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize InsertQuery', function () {
        const q = Insert('table1', {id: 1});
        assert.strictEqual(q && q._type, SerializationType.INSERT_QUERY);
    });

    it('should serialize insert', function () {
        const query = Insert('table1', {id: 1, name: 'aaa'});
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    });

    it('should serialize insert.into', function () {
        const query = Insert('table1', {id: 1, name: 'aaa'});
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    });

    it('should pass raw as table name', function () {
        const query = Insert(Raw('table1'), {id: 1, name: 'aaa'});
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'insert into table1 (id, name) values (1, \'aaa\')');
    });

    it('should validate first (tableName) argument', function () {
        assert.throws(() => Insert(null, {id: 1, name: 'aaa'}),
            /as first argument/);
    });

    it('should validate second (values) argument', function () {
        assert.throws(() => Insert('table1', [1, 'aaa']),
            /as second argument/);
        assert.throws(() => Insert('table1', 'sdfds'),
            /as second argument/);
    });

    it('should serialize params with "values" argument', function () {
        const query = Insert('table1', {id: Param('id'), name: Param('name')});
        const result = query.generate(Object.assign({
            values: {
                id: 1,
                name: 'abc'
            }
        }, options));
        assert.strictEqual(result.sql, 'insert into table1 (id, name) values (:id, :name)');
        assert.deepStrictEqual(result.params, {
            id: 1,
            name: 'abc'
        });
    });

    it('should serialize params with query.params', function () {
        const query = Insert('table1', {id: Param('id'), name: Param('name')})
            .values({
                id: 1,
                name: 'abc'
            });
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'insert into table1 (id, name) values (:id, :name)');
        assert.deepStrictEqual(result.params, {
            id: 1,
            name: 'abc'
        });
    });

    it('should validate query.params', function () {
        assert.throws(() =>
                Insert('table1', {id: /id/, name: /name/})
                    .values([1, 'abc']),
            /Invalid argument/);
    });

    it('should serialize insert/select query', function () {
        const query = Insert('table1',
            Select('id', 'the_name name').from('table2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'insert into table1 (id, name) values (select id, the_name as name from table2)');
    });

    it('should serialize insert with returning', function () {
        const query = Insert('table1', {id: 1, name: 'aaa'})
            .returning('id', 'update as u1');
        const result = query.generate(options);
        assert.strictEqual(result.sql,
            'insert into table1 (id, name) values (1, \'aaa\') ' +
            'returning id, "update" as u1');
        assert.deepStrictEqual(result.returningFields,
            [{field: 'id', alias: undefined},
                {field: 'update', alias: 'u1'}]);
    });

    it('should validate returning() arguments', function () {
        Insert('table1', {id: 1, name: 'aaa'})
            .returning(null);
        assert.throws(() =>
                Insert('table1', {id: 1, name: 'aaa'})
                    // @ts-ignore
                    .returning('123'),
            /does not match/);
    });

});
