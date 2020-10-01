import assert from 'assert';
import {Select} from '@sqb/core';
import {Connection, registerAdapter, unRegisterAdapter} from '@sqb/connect';
import {TestAdapter} from './_support/test_adapter';

describe('Connection', function () {

    let connection: Connection;
    const testAdapter = new TestAdapter();

    before(() => registerAdapter(testAdapter.driver, testAdapter));
    before(() => {
        if (!connection)
            connection = new Connection({driver: testAdapter.driver});
    });

    after(() => unRegisterAdapter(testAdapter.driver));
    after(async () => {
        if (connection)
            await connection.close(true);
        connection = undefined;
    });

    it('should throw if no configuration argument given', function () {
        assert.throws(() => new Connection(undefined),
            /Configuration object required/);
    });

    it('should throw if adapter for driver is not registered', function () {
        assert.throws(() =>
                new Connection({driver: 'unknown'}),
            /No connection adapter registered for/);
    });

    it('should initialize Connection', function () {
        connection = new Connection({
            driver: testAdapter.driver
        });
        assert.strictEqual(connection.dialect, 'test-dialect');
    });

    it('should initialize default options', function () {
        connection = new Connection({driver: testAdapter.driver});
        const config = connection.configuration;
        assert.strictEqual(config.pool.acquireMaxRetries, 0);
        assert.strictEqual(config.pool.acquireRetryWait, 2000);
        assert.strictEqual(config.pool.acquireTimeoutMillis, 0);
        assert.strictEqual(config.pool.idleTimeoutMillis, 30000);
        assert.strictEqual(config.pool.max, 10);
        assert.strictEqual(config.pool.min, 0);
        assert.strictEqual(config.pool.minIdle, 0);
        assert.strictEqual(config.pool.maxQueue, 1000);
        assert.strictEqual(config.pool.validation, false);
    });

    it('should execute() select query', async function () {
        const result = await connection.execute('select * from airports', {
            objectRows: false,
            values: []
        })
        assert(result && result.rows);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should execute() select query - 2 args', async function () {
        const result = await connection.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].ID === 'LFOI');
    });

    it('should execute() limit fetchRows', async function () {
        const result = await connection.execute('select * from airports', {
            objectRows: false,
            fetchRows: 2
        });
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should select() and return array rows', async function () {
        const result = await connection.execute(
            Select().from('airports'),
            {objectRows: false, fetchRows: 2})
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(Array.isArray(result.rows[0]));
        assert(result.rows[0][0] === 'LFOI');
    });

    it('should select() and return object rows', async function () {
        const result = await connection.execute(Select().from('airports'), {fetchRows: 2});
        assert(result && result.rows);
        assert.strictEqual(result.rows.length, 2);
        assert(!Array.isArray(result.rows[0]));
        assert(result.rows[0].ID === 'LFOI');
    });

    it('should insert record', async function () {
        const c = testAdapter.recordCount('airports');
        const x = {id: 1};
        const result = await connection.execute('insert into airports (id) valus (:id)',
            {values: x});
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
    });

    it('should insert record with returning', async function () {
        const c = testAdapter.recordCount('airports');
        const x = {id: 1};
        const result = await connection.execute('insert into airports (id) valus (:id) returning id',
            {values: x});
        assert(result);
        assert.strictEqual(result.rowsAffected, 1);
        assert.deepStrictEqual(result.returns, x);
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
    });

    it('should acquire a new session and execute the callback', async function () {
        await connection.acquire(async (session) => {
            const result = await session.execute('select * from airports', {
                objectRows: false,
                values: []
            })
            assert(result && result.rows);
            assert(Array.isArray(result.rows[0]));
            assert(result.rows[0][0] === 'LFOI');
        });
    });

    it('should acquire a new session and execute the callback in transaction', async function () {
        const c = testAdapter.recordCount('airports');
        await connection.acquire(async (session) => {
            const x = {id: 1};
            await session.execute('insert into airports (id) valus (:id) returning id',
                {values: x});
            assert.strictEqual(testAdapter.recordCount('airports'), c);
        }, {inTransaction: true});
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
    });

    it('should rollback transaction on error', async function () {
        const c = testAdapter.recordCount('airports');
        try {
            await connection.acquire(async (session) => {
                const x = {id: 1};
                await session.execute('insert into airports (id) valus (:id) returning id',
                    {values: x});
                assert.strictEqual(testAdapter.recordCount('airports'), c);
                throw new Error('any error');
            }, {inTransaction: true});
        } catch (ignored) {
            //
        }
        assert.strictEqual(testAdapter.recordCount('airports'), c);
    });

    it('should commit in callback function', async function () {
        const c = testAdapter.recordCount('airports');
        try {
            await connection.acquire(async (session) => {
                const x = {id: 1};
                await session.execute('insert into airports (id) valus (:id) returning id',
                    {values: x});
                assert.strictEqual(testAdapter.recordCount('airports'), c);
                await session.commit();
                throw new Error('any error');
            }, {inTransaction: true});
        } catch (ignored) {
            //
        }
        assert.strictEqual(testAdapter.recordCount('airports'), c + 1);
    });

    it('should rollback in callback function', async function () {
        const c = testAdapter.recordCount('airports');
        await connection.acquire(async (session) => {
            const x = {id: 1};
            await session.execute('insert into airports (id) valus (:id) returning id',
                {values: x});
            await session.rollback();
        }, {inTransaction: true});
        assert.strictEqual(testAdapter.recordCount('airports'), c);
    });

    it('should use defaults.objectRows option', async function () {
        connection.configuration.defaults.objectRows = false;
        let result = await connection.execute('select * from airports');
        assert(Array.isArray(result.rows[0]));
        connection.configuration.defaults.objectRows = null;
        result = await connection.execute('select * from airports');
        assert(!Array.isArray(result.rows[0]));
    });

    it('should use defaults.naming option', async function () {
        connection.configuration.defaults.fieldNaming = 'lowercase';
        let result = await connection.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].id, 'LFOI');

        connection.configuration.defaults.fieldNaming = 'uppercase';
        result = await connection.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].ID, 'LFOI');

        connection.configuration.defaults.fieldNaming = 'camelcase';
        result = await connection.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].shortName, 'ABBEV');

        connection.configuration.defaults.fieldNaming = 'pascalcase';
        result = await connection.execute('select * from airports');
        assert(result && result.rows);
        assert(!Array.isArray(result.rows[0]));
        assert.strictEqual(result.rows[0].ShortName, 'ABBEV');
    });

    it('should set defaults.showSql option', async function () {
        connection.configuration.defaults.showSql = true;
        const result = await connection.execute('select * from airports');
        assert.strictEqual(result.query.sql, 'select * from airports');
        connection.configuration.defaults.showSql = null;
    });

    it('should set defaults.showSql option', async function () {
        connection.configuration.defaults.showSql = true;
        connection.configuration.defaults.autoCommit = true;
        const result = await connection.execute('select * from airports');
        assert.strictEqual(result.query.autoCommit, true);
        connection.configuration.defaults.showSql = null;
    });

    it('should set defaults.ignoreNulls option', async function () {
        connection.configuration.defaults.ignoreNulls = true;
        let result = await connection.execute('select * from airports');
        assert.strictEqual(result.rows[0].Catalog, undefined);
        connection.configuration.defaults.ignoreNulls = null;
        result = await connection.execute('select * from airports');
        assert.strictEqual(result.rows[0].Catalog, null);
    });

    it('should emit `execute` event', async function () {
        let i = 0;
        const fn = () => i++;
        connection.once('execute', fn);
        await connection.execute('select * from airports');
        assert.strictEqual(i, 1);
    });

});
