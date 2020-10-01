import assert from 'assert';
import {Readable} from 'stream';
import {Select} from '@sqb/core';
import {Adapter, Connection, Cursor} from '../src';
import {data, TestAdapter} from './_support/test_adapter';
import {Session} from '../src/Session';

function readStream(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        let bytes = Buffer.from('');
        stream.on('data', (chunk): void => {
            bytes = Buffer.concat([bytes, chunk]);
        });
        stream.on('end', () => {
            try {
                resolve(bytes.toString());
            } catch (err) {
                reject(err);
            }
        });
    })
}

function readObjectStream(stream: Readable): Promise<any> {
    return new Promise((resolve, reject) => {
        const arr = [];
        stream.on('data', (chunk): void => {
           arr.push(chunk);
        });
        stream.on('end', () => {
            try {
                resolve(arr);
            } catch (err) {
                reject(err);
            }
        });
    })
}

describe('CursorStream', function () {

    let connection: Connection;
    let cursor: Cursor;
    const testAdapter = new TestAdapter();
    const airports = data.airports;

    before(() => Adapter.registerAdapter(testAdapter.driver, testAdapter));
    before(() => {
        if (!connection)
            connection = new Connection({
                driver: testAdapter.driver,
                defaults: {
                    createCursor: true,
                    fetchRows: 10
                }
            });
    });

    after(() => Adapter.unRegisterAdapter(testAdapter.driver));
    after(async () => {
        if (connection)
            await connection.close(true);
        connection = undefined;
    });

    it('should stream string buffer', async function () {
        await connection.acquire(async (session: Session) => {
            const result = await session.execute(Select().from('airports'));
            cursor = result && result.cursor;
            const stream = cursor.toStream();
            const buf = await readStream(stream);
            assert.strictEqual(typeof buf, 'string');
            const obj = JSON.parse(buf);
            assert(Array.isArray(obj));
            assert.strictEqual(obj.length, airports.rows.length);
            assert(stream.isClosed);
        });
    });

    it('should stream row object if objectMode enabled', async function () {
        await connection.acquire(async (session: Session) => {
            const result = await session.execute(Select().from('airports'));
            cursor = result && result.cursor;
            const stream = cursor.toStream({objectMode: true});
            const arr = await readObjectStream(stream);
            assert(Array.isArray(arr));
            assert.strictEqual(arr.length, airports.rows.length);
            assert(stream.isClosed);
        });
    });

    it('should cursor.close() also close the stream', function(done) {
        connection.acquire(async (session: Session) => {
            const result = await session.execute(Select().from('airports'));
            cursor = result && result.cursor;
            const stream = cursor.toStream();
            stream.on('close', () => done());
            await cursor.close();
        }).catch(done);
    });

    it('should handle cursor errors', function(done) {
        connection.acquire(async (session: Session) => {
            const result = await session.execute(Select().from('airports'));
            cursor = result && result.cursor;
            (cursor as any)._adapterCursor.close = () => Promise.reject(new Error('Any error'));
            const stream = cursor.toStream();
            stream.on('error', () => {
                delete result.cursor._adapterCursor.close;
                stream.close().then(done).catch(done);
            });
            stream.close().catch(() => 0);
        }).catch(done);
    });

});
