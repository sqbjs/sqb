import '../_support/env';
import assert from 'assert';
import {Insert, Param, Select} from '@sqb/builder';
import '@sqb/postgres';
import {Client} from '@sqb/connect';
import {createTestSchema} from '../../../postgres/test/_support/create-db';

describe('Client', function () {

    let client: Client;
    const dialect = 'postgres';

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async () => {
            this.timeout(30000);
            await createTestSchema();
        })
    }

    before(() => {
        if (!client)
            client = new Client({dialect: 'postgres'});
    });
    after(async () => {
        if (client)
            await client.close(0);
        client = undefined;
    });

    it('should throw if no configuration argument given', function () {
        assert.throws(() => new Client(undefined),
            /Configuration object required/);
    });

    it('should throw if adapter for driver is not registered', function () {
        assert.throws(() =>
                new Client({driver: 'unknown'}),
            /No database adapter registered for/);
    });

    it('should initialize client with driver name', function () {
        client = new Client({driver: 'postgresql-client'});
        assert.strictEqual(client.dialect, dialect);
        assert.strictEqual(client.driver, 'postgresql-client');
    });

    it('should initialize client with dialect name', function () {
        client = new Client({dialect});
        assert.strictEqual(client.dialect, dialect);
        assert.strictEqual(client.driver, 'postgresql-client');
    });

    it('should initialize default options', function () {
        client = new Client({dialect});
        const opts = client.pool.options;
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
            'select * from airports', {
                objectRows: false
            });
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0][0], 'LFOI');
    });

    it('should execute an sqb query', async function () {
        const result = await client.execute(
            Select().from('airports'), {
                objectRows: false
            })
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0][0], 'LFOI');
    });

    it('should select() and return array rows', async function () {
        const result = await client.execute(
            Select().from('airports'),
            {objectRows: false, fetchRows: 2})
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should select() and return object rows', async function () {
        const result = await client.execute(
            Select().from('airports'),
            {fetchRows: 2});
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].id === 'LFOI');
    });

    it('should limit returning record with fetchRows property', async function () {
        const result = await client.execute(
            Select().from('airports'), {
                objectRows: false,
                fetchRows: 2
            });
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should insert record', async function () {
        const c = (await client.execute('select count(*) from airports')).rows[0].count;
        const result = await client.execute(Insert('airports', {id: 1}));
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        const c2 = (await client.execute('select count(*) from airports')).rows[0].count;
        assert.strictEqual(c2, c + 1);
    });

    it('should insert record with returning', async function () {
        const id = 'X' + Math.floor(Math.random() * 10000);
        const query = Insert('airports', {
            id,
            shortname: 'ShortName1',
            name: 'Name1'
        }).returning('id::string');
        const result = await client.execute(query);
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        assert.deepStrictEqual(result.rows[0].id, id);
    });

    it('should acquire(callback) acquire a new session and execute the callback', async function () {
        await client.acquire(async (connection) => {
            const result = await connection.execute('select * from airports', {
                objectRows: false,
                values: []
            })
            assert(result && result.rows);
            assert(Array.isArray(result.rows[0]));
            assert.strictEqual(result.rows[0][0], 'LFOI');
        });
    });

    it('should acquire(callback) rollback transaction on error', async function () {
        const c = (await client.execute('select count(*) from airports')).rows[0].count;
        try {
            await client.acquire(async (connection) => {
                await connection.startTransaction();
                const x = {id: 1};
                await connection.execute('insert into airports (id) values (:id)',
                    {values: x});
                const c2 = (await connection.execute('select count(*) from airports')).rows[0].count;
                assert.strictEqual(c2, c);
                throw new Error('any error');
            });
        } catch (ignored) {
            //
        }
        const c3 = (await client.execute('select count(*) from airports')).rows[0].count;
        assert.strictEqual(c3, c);
    });

    it('should commit can be called in execute(callback)', async function () {
        const c = (await client.execute('select count(*) from airports')).rows[0].count;
        const id = 'X' + Math.floor(Math.random() * 10000);
        await client.acquire(async (connection) => {
            await connection.execute(
                Insert('airports', {id: Param('id')}),
                {values: {id}});
            const c2 = (await connection.execute('select count(*) from airports')).rows[0].count;
            assert.strictEqual(c2, c + 1);
            await connection.commit();
        });
        const c3 = (await client.execute('select count(*) from airports')).rows[0].count;
        assert.strictEqual(c3, c + 1);
    });

    it('should rollback can be called in execute(callback)', async function () {
        const c = (await client.execute('select count(*) from airports')).rows[0].count;
        await client.acquire(async (connection) => {
            await connection.startTransaction();
            const id = 'X' + Math.floor(Math.random() * 10000);
            await connection.execute(
                Insert('airports', {id: Param('id')}),
                {values: {id}});
            await connection.rollback();
        });
        const c2 = (await client.execute('select count(*) from airports')).rows[0].count;
        assert.strictEqual(c2, c);
    });

    it('should use defaults.objectRows option', async function () {
        client.defaults.objectRows = false;
        let result = await client.execute('select * from airports');
        assert(Array.isArray(result.rows[0]));
        client.defaults.objectRows = null;
        result = await client.execute('select * from airports');
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
    });

    it('should set defaults.showSql option', async function () {
        client.defaults.showSql = true;
        const result = await client.execute('select * from airports');
        assert.strictEqual(result.query.sql, 'select * from airports');
        client.defaults.showSql = null;
    });

    it('should set defaults.showSql option', async function () {
        client.defaults.showSql = true;
        client.defaults.autoCommit = true;
        const result = await client.execute('select * from airports');
        assert.strictEqual(result.query.autoCommit, true);
        client.defaults.showSql = null;
    });

    it('should set defaults.ignoreNulls option', async function () {
        client.defaults.ignoreNulls = true;
        let result = await client.execute('select * from airports');
        assert.strictEqual(result.rows[0].Catalog, undefined);
        client.defaults.ignoreNulls = null;
        result = await client.execute('select * from airports');
        assert.strictEqual(result.rows[0].Catalog, null);
    });

    it('should emit `execute` event', async function () {
        let i = 0;
        const fn = () => i++;
        client.once('execute', fn);
        await client.execute('select * from airports');
        assert.strictEqual(i, 1);
    });

});
