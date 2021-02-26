/* eslint-disable camelcase */
import '../_support/env';
import assert from 'assert';
import {Insert, Param, Select} from '@sqb/builder';
import '@sqb/postgres';
import {SqbClient} from '@sqb/connect';
import {initClient} from '../_support/init-client';

describe('Client', function () {

    const client = initClient();
    const dialect = 'postgres';
    const insertedIds: any[] = [];

    it('should throw if no configuration argument given', function () {
        assert.throws(() => new SqbClient(undefined),
            /Configuration object required/);
    });

    it('should throw if adapter for driver is not registered', function () {
        assert.throws(() =>
                new SqbClient({driver: 'unknown'}),
            /No database adapter registered for/);
    });

    it('should initialize client with driver name', function () {
        const _client = new SqbClient({driver: 'postgresql-client'});
        assert.strictEqual(_client.dialect, dialect);
        assert.strictEqual(_client.driver, 'postgresql-client');
    });

    it('should initialize client with dialect name', function () {
        const _client = new SqbClient({dialect});
        assert.strictEqual(_client.dialect, dialect);
        assert.strictEqual(_client.driver, 'postgresql-client');
    });

    it('should initialize default options', function () {
        const _client = new SqbClient({dialect});
        const opts = _client.pool.options;
        assert.strictEqual(opts.acquireMaxRetries, 0);
        assert.strictEqual(opts.acquireRetryWait, 2000);
        assert.strictEqual(opts.acquireTimeoutMillis, 0);
        assert.strictEqual(opts.idleTimeoutMillis, 30000);
        assert.strictEqual(opts.max, 10);
        assert.strictEqual(opts.min, 0);
        assert.strictEqual(opts.minIdle, 0);
        assert.strictEqual(opts.maxQueue, 1000);
        assert.strictEqual(opts.validation, false);
    });

    it('should make a connection test', async function () {
        await client.test();
    });

    it('should execute a raw select query', async function () {
        const result = await client.execute(
            'select * from customers', {
                objectRows: false
            });
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0][0], 1);
    });

    it('should execute an sqb query', async function () {
        const result = await client.execute(
            Select().from('customers'), {
                objectRows: false
            })
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0][0], 1);
    });

    it('should select() and return array rows', async function () {
        const result = await client.execute(
            Select().from('customers'),
            {objectRows: false, fetchRows: 2})
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 1);
    });

    it('should select() and return object rows', async function () {
        const result = await client.execute(
            Select().from('customers'),
            {fetchRows: 2});
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].id === 1);
    });

    it('should limit returning record with fetchRows property', async function () {
        const result = await client.execute(
            Select().from('customers'), {
                objectRows: false,
                fetchRows: 2
            });
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 1);
    });

    it('should insert record', async function () {
        const given = 'X' + Math.floor(Math.random() * 10000);
        const c = (await client.execute('select count(*) from customers')).rows[0].count;
        const result = await client.execute(Insert('customers', {given_name: given}));
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        const c2 = (await client.execute('select count(*) from customers')).rows[0].count;
        assert.strictEqual(c2, c + 1);
    });

    it('should insert record with returning', async function () {
        const given = 'X' + Math.floor(Math.random() * 10000);
        const family = 'X' + Math.floor(Math.random() * 10000);
        const query = Insert('customers', {
            given_name: given,
            family_name: family,
            city: null,
        }).returning('id');
        const result = await client.execute(query);
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        assert.ok(result.rows[0].id > 0);
        insertedIds.push(result.rows[0].id);
    });

    it('should acquire(callback) acquire a new session and execute the callback', async function () {
        await client.acquire(async (connection) => {
            const result = await connection.execute('select * from customers', {
                objectRows: false,
                params: []
            })
            assert(result && result.rows);
            assert(Array.isArray(result.rows[0]));
            assert.strictEqual(result.rows[0][0], 1);
        });
    });

    it('should acquire(callback) rollback transaction on error', async function () {
        const c = (await client.execute('select count(*) from customers')).rows[0].count;
        try {
            await client.acquire(async (connection) => {
                await connection.startTransaction();
                await connection.execute('insert into customers (given_name) values (:given)', {
                    params: {
                        given: 'John'
                    }
                });
                const c2 = (await connection.execute('select count(*) from customers'))
                    .rows[0].count;
                assert.strictEqual(c2, c);
                throw new Error('any error');
            });
        } catch (ignored) {
            //
        }
        const c3 = (await client.execute('select count(*) from customers')).rows[0].count;
        assert.strictEqual(c3, c);
    });

    it('should acquire(callback) rollback transaction if not committed', async function () {
        const c = (await client.execute('select count(*) from customers')).rows[0].count;
        try {
            await client.acquire(async (connection) => {
                await connection.startTransaction();
                await connection.execute('insert into customers (given_name) values (:given)', {
                    params: {
                        given: 'John'
                    }
                });
                const c2 = (await connection.execute('select count(*) from customers'))
                    .rows[0].count;
                assert.strictEqual(c2, c);
            });
        } catch (ignored) {
            //
        }
        const c3 = (await client.execute('select count(*) from customers')).rows[0].count;
        assert.strictEqual(c3, c);
    });

    it('should commit can be called in execute(callback)', async function () {
        const c = (await client.execute('select count(*) from customers')).rows[0].count;
        const given = 'X' + Math.floor(Math.random() * 10000);
        await client.acquire(async (connection) => {
            await connection.execute(
                Insert('customers', {given_name: Param('given')}),
                {params: {given}});
            const c2 = (await connection.execute('select count(*) from customers')).rows[0].count;
            assert.strictEqual(c2, c + 1);
            await connection.commit();
        });
        const c3 = (await client.execute('select count(*) from customers')).rows[0].count;
        assert.strictEqual(c3, c + 1);
    });

    it('should rollback can be called in execute(callback)', async function () {
        const c = (await client.execute('select count(*) from customers')).rows[0].count;
        await client.acquire(async (connection) => {
            await connection.startTransaction();
            const given = 'X' + Math.floor(Math.random() * 10000);
            await connection.execute(
                Insert('customers', {given_name: Param('given')}),
                {params: {given}});
            await connection.rollback();
        });
        const c2 = (await client.execute('select count(*) from customers')).rows[0].count;
        assert.strictEqual(c2, c);
    });

    it('should get and set active schema of connection', async function () {
        await client.acquire(async (connection) => {
            const schema = await connection.getSchema();
            assert.ok(schema);
            await connection.setSchema('postgres');
            assert.strictEqual((await connection.getSchema()), 'postgres');
            await connection.setSchema(schema);
            assert.strictEqual((await connection.getSchema()), schema);
        })
    });

    it('should use defaults.objectRows option', async function () {
        client.defaults.objectRows = false;
        let result = await client.execute('select * from customers');
        assert(Array.isArray(result.rows[0]));
        client.defaults.objectRows = null;
        result = await client.execute('select * from customers');
        assert(!Array.isArray(result.rows[0]));
    });

    it('should use defaults.fieldNaming option', async function () {
        client.defaults.fieldNaming = 'lowercase';
        let result = await client.execute('select 1 as test_field');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].test_field, 1);

        client.defaults.fieldNaming = 'uppercase';
        result = await client.execute('select 1 as test_field');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].TEST_FIELD, 1);

        client.defaults.fieldNaming = 'camelcase';
        result = await client.execute('select 1 as test_field');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].testField, 1);

        client.defaults.fieldNaming = 'pascalcase';
        result = await client.execute('select 1 as test_field');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].TestField, 1);
        client.defaults.fieldNaming = undefined;
    });

    it('should set defaults.showSql option', async function () {
        client.defaults.showSql = true;
        const result = await client.execute('select * from customers');
        assert.strictEqual(result.query.sql, 'select * from customers');
        client.defaults.showSql = null;
    });

    it('should set defaults.showSql option', async function () {
        client.defaults.showSql = true;
        client.defaults.autoCommit = true;
        const result = await client.execute('select * from customers');
        assert.strictEqual(result.query.autoCommit, true);
        client.defaults.showSql = null;
    });

    it('should set defaults.ignoreNulls option', async function () {
        client.defaults.ignoreNulls = true;
        let result = await client.execute(
            Select().from('customers').where({id: insertedIds[0]})
        );
        assert.strictEqual(result.rows[0].city, undefined);
        client.defaults.ignoreNulls = null;
        result = await client.execute(
            Select().from('customers').where({id: insertedIds[0]})
        );
        assert.strictEqual(result.rows[0].city, null);
    });

    it('should emit `execute` event', async function () {
        let i = 0;
        const fn = () => i++;
        client.once('execute', fn);
        await client.execute('select * from customers');
        assert.strictEqual(i, 1);
    });

});
