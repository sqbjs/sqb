import './_support/env';
import assert from 'assert';
import {Select} from '@sqb/builder';
import {Client, registerAdapter, unRegisterAdapter} from '@sqb/connect';
import {TestAdapter} from './_support/test_adapter';

describe('Client', function () {

    let client: Client;
    const testAdapter = new TestAdapter();

    before(() => registerAdapter(testAdapter));
    before(() => {
        if (!client)
            client = new Client({driver: testAdapter.driver});
    });

    after(() => unRegisterAdapter(testAdapter));
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
        client = new Client({
            driver: testAdapter.driver
        });
        assert.strictEqual(client.driver, testAdapter.driver);
        assert.strictEqual(client.dialect, testAdapter.dialect);
    });

    it('should initialize client with dialect name', function () {
        client = new Client({
            dialect: testAdapter.dialect
        });
        assert.strictEqual(client.driver, testAdapter.driver);
        assert.strictEqual(client.dialect, testAdapter.dialect);
    });

    it('should initialize default options', function () {
        client = new Client({driver: testAdapter.driver});
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
        const result = await client.execute(`select * from airports`, {
            objectRows: false
        });
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0][0], 'LFOI');
    });

    it('should execute an sqb select query', async function () {
        const result = await client.execute(Select().from('airports'), {
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
        assert.strictEqual(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should select() and return object rows', async function () {
        const result = await client.execute(Select().from('airports'), {fetchRows: 2});
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].ID === 'LFOI');
    });

    it('should limit returning record with fetchRows property', async function () {
        const result = await client.execute('select * from airports', {
            objectRows: false,
            fetchRows: 2
        });
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should insert record', async function () {
        const c = testAdapter.recordCount('airports');
        const x = {id: 1};
        const result = await client.execute('insert into airports (id) valus (:id)',
            {values: x});
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
    });

    it('should insert record with returning', async function () {
        const c = testAdapter.recordCount('airports');
        const x = {id: 1};
        const result = await client.execute('insert into airports (id) valus (:id) returning id',
            {values: x});
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        assert.deepStrictEqual(result.rows[0], x);
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
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
        const c = testAdapter.recordCount('airports');
        try {
            await client.acquire(async (connection) => {
                await connection.startTransaction();
                const x = {id: 1};
                await connection.execute('insert into airports (id) values (:id) returning id',
                    {values: x});
                assert.strictEqual(testAdapter.recordCount('airports'), c);
                throw new Error('any error');
            });
        } catch (ignored) {
            //
        }
        assert.strictEqual(testAdapter.recordCount('airports'), c);
    });

    it('should execute(callback) commit in callback function', async function () {
        const c = testAdapter.recordCount('airports');
        try {
            await client.acquire(async (connection) => {
                const x = {id: 1};
                await connection.execute('insert into airports (id) valus (:id) returning id',
                    {values: x});
                assert.strictEqual(testAdapter.recordCount('airports'), c);
                await connection.commit();
                throw new Error('any error');
            });
        } catch (ignored) {
            //
        }
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
    });

    it('should execute(callback) rollback in callback function', async function () {
        const c = testAdapter.recordCount('airports');
        await client.acquire(async (connection) => {
            await connection.startTransaction();
            const x = {id: 1};
            await connection.execute('insert into airports (id) valus (:id) returning id',
                {values: x});
            await connection.rollback();
        });
        assert.strictEqual(testAdapter.recordCount('airports'), c);
    });

    it('should use defaults.objectRows option', async function () {
        client.defaults.objectRows = false;
        let result = await client.execute('select * from airports');
        assert(Array.isArray(result.rows[0]));
        client.defaults.objectRows = null;
        result = await client.execute('select * from airports');
        assert(!Array.isArray(result.rows[0]));
    });

    it('should use defaults.naming option', async function () {
        client.defaults.fieldNaming = 'lowercase';
        let result = await client.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].id, 'LFOI');

        client.defaults.fieldNaming = 'uppercase';
        result = await client.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].ID, 'LFOI');

        client.defaults.fieldNaming = 'camelcase';
        result = await client.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].shortName, 'ABBEV');

        client.defaults.fieldNaming = 'pascalcase';
        result = await client.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].ShortName, 'ABBEV');
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
