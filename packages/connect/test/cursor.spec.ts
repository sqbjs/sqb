import './_support/env';
import assert from 'assert';
import {Select} from '@sqb/builder';
import {registerAdapter, unRegisterAdapter, Client, Cursor} from '../src';
import {TestAdapter, data} from './_support/test_adapter';
import {Connection} from '../src/Connection';

describe('Cursor', function () {

    let client: Client;
    let cursor: Cursor;
    const testAdapter = new TestAdapter();
    const airports = data.airports;

    before(() => registerAdapter(testAdapter));
    before(() => {
        if (!client)
            client = new Client({
                driver: testAdapter.driver,
                defaults: {
                    cursor: true,
                    fetchRows: 10
                }
            });
    });

    after(() => unRegisterAdapter(testAdapter));
    after(async () => {
        if (client)
            await client.close(0);
        client = undefined;
    });

    it('should return Cursor for select queries', async function () {
        const result = await client.execute(Select().from('airports'));
        cursor = result && result.cursor;
        assert(cursor);
        assert.strictEqual(cursor.isBof, true);
        assert.strictEqual(cursor.inspect(), '[object Cursor]');
        assert(cursor.connection);
        return cursor.close();
    });

    it('should iterate rows', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            let i = 0;
            let row;
            assert.strictEqual(cursor.isBof, true);
            assert.strictEqual(cursor.isEof, false);
            while ((row = await cursor.next())) {
                assert.strictEqual(cursor.isBof, false);
                assert.deepStrictEqual(row, airports.rows[i++]);
                assert.strictEqual(cursor.rowNum, i);
            }
            assert.strictEqual(cursor.isBof, false);
            await cursor.next();
            assert.strictEqual(cursor.isEof, true);
        });
    });

    it('should automatically close cursor when connection closed (manuel)', function (done) {
        Promise.resolve().then(async () => {
            const connection = await client.acquire();
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            cursor.on('close', done);
            connection.release();
        }).catch(done);
    });

    it('should automatically close cursor when after acquire block', function (done) {
        Promise.resolve().then(async () =>
            client.acquire(async connection => {
                const result = await connection.execute(Select().from('airports'));
                cursor = result && result.cursor;
                cursor.on('close', done);
            })
        ).catch(done);
    });

    it('should automatically connection when cursor closed', function (done) {
        Promise.resolve().then(async () => {
            const result = await client.execute(Select().from('airports'));
            cursor = result && result.cursor;
            cursor.connection.once('close', done);
            await cursor.close();
        }).catch(done);
    });

    it('should seek() move cursor', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            let curRow = NaN;
            cursor.on('move', (rowNum) => {
                curRow = rowNum;
            });
            await cursor.seek(10);
            assert.strictEqual(cursor.isBof, false);
            assert.strictEqual(cursor.rowNum, 10);
            assert.deepStrictEqual(cursor.row, airports.rows[cursor.rowNum - 1]);
            assert.strictEqual(cursor.rowNum, curRow);
        });
    });

    it('should seek(big number) move cursor to eof', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            await cursor.seek(10000);
            assert.strictEqual(cursor.isBof, false);
            assert.strictEqual(cursor.isEof, true);
            assert(!cursor.row);
            assert.strictEqual(cursor.rowNum, airports.rows.length + 1);
        });
    });

    it('should seek(big number) move cursor to eof (cached)', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            cursor.cached();
            await cursor.seek(10000);
            assert.strictEqual(cursor.isBof, false);
            assert.strictEqual(cursor.isEof, true);
            assert(!cursor.row);
            assert.strictEqual(cursor.rowNum, airports.rows.length + 1);
            assert.strictEqual((cursor as any)._cache.length, airports.rows.length);
        });
    });

    it('should cache rows', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            cursor.cached();
            await cursor.seek(50);
            assert.strictEqual((cursor as any)._cache.length, 50);
        });
    });

    it('should move cursor back if cached', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            cursor.cached();
            await cursor.seek(50);
            assert.strictEqual(cursor.rowNum, 50);
            assert.deepStrictEqual(cursor.row, airports.rows[cursor.rowNum - 1]);
            await cursor.moveTo(10);
            assert.strictEqual(cursor.rowNum, 10);
            assert.deepStrictEqual(cursor.row, airports.rows[cursor.rowNum - 1]);
            await cursor.prev();
            assert.strictEqual(cursor.rowNum, 9);
            assert.deepStrictEqual(cursor.row, airports.rows[cursor.rowNum - 1]);
        });
    });

    it('should seek(0) do nothing', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            cursor.cached();
            await cursor.seek(50);
            assert.strictEqual(cursor.rowNum, 50);
            assert.deepStrictEqual(cursor.row, airports.rows[cursor.rowNum - 1]);
            await cursor.seek(0);
            assert.strictEqual(cursor.rowNum, 50);
            assert.deepStrictEqual(cursor.row, airports.rows[cursor.rowNum - 1]);
        });
    });


    it('should reset cursor in cached mode', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            cursor.cached();
            await cursor.seek(50);
            assert.strictEqual(cursor.rowNum, 50);
            cursor.reset();
            assert.strictEqual(cursor.rowNum, 0);
        });
    });

    it('should not reset cursor in non cached mode', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            assert.throws(() => cursor.reset(),
                /method needs cache to be enabled/);
        });
    });

    it('should fetchAll() emit eof', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            cursor.cached();
            let eofCalled = false;
            cursor.on('eof', () => eofCalled = true);
            await cursor.fetchAll();
            assert.strictEqual(eofCalled, true);
        });
    });

    it('should fetchAll() does not emit "move" event', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            cursor.cached();
            assert(cursor);
            let moveCalled = false;
            cursor.on('move', () => {
                moveCalled = true;
            });
            await cursor.fetchAll();
            assert.strictEqual(moveCalled, false);
        });
    });

    it('should close cursor after fetched all rows', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            let closeCalled = false;
            cursor.on('close', () => {
                closeCalled = true;
            });
            while (await cursor.next()) {
                //
            }
            assert.strictEqual(closeCalled, true);
        });
    });

    it('should not fetch rows if closed', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            await cursor.close();
            await assert.rejects(() => cursor.next(),
                /Cursor is closed/);
        });
    });

    it('should cache can not be enabled after fetch', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            await cursor.next();
            await assert.throws(() => cursor.cached(),
                /Cache can be enabled before fetching rows/);
        });

    });

    it('should handle close error', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            (cursor as any)._intlcur.close = () => Promise.reject(new Error('Any error'));
            await assert.rejects(() => cursor.close(),
                /Any error/);
        });
    });

    it('should handle adapter errors', async function () {
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(Select().from('airports'));
            cursor = result && result.cursor;
            assert(cursor);
            (cursor as any)._intlcur.fetch = () => Promise.reject(new Error('Any error'));
            await assert.rejects(() => cursor.next(),
                /Any error/);
        });
    });

    it('should queries call `fetch` events on fetching new rows', async function () {
        let l = 0;
        const query = Select().from('airports')
            .onFetch((row) => row.customField = ++l);
        await client.acquire(async (connection: Connection) => {
            const result = await connection.execute(query);
            cursor = result && result.cursor;
            assert(cursor);
            await cursor.seek(10);
            assert.strictEqual(cursor.rowNum, 10);
            assert.strictEqual(cursor.rowNum, l);
            assert.strictEqual(cursor.row.customField, l);
        });
    });
});
