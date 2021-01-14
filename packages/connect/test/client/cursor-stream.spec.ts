import '../_support/env';
import assert from 'assert';
import {Readable} from 'stream';
import {Select} from '@sqb/builder';
import {Cursor} from '@sqb/connect';
import {SqbConnection} from '../../src/client/SqbConnection';
import {initClient} from '../_support/init-client';

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

    const client = initClient({defaults: {cursor: true, objectRows: true}});
    let cursor: Cursor;

    it('should stream string buffer', async function () {
        this.slow(1000);
        await client.acquire(async (session: SqbConnection) => {
            const result = await session.execute(Select().from('customers'));
            cursor = result && result.cursor;
            const stream = cursor.toStream();
            const buf = await readStream(stream);
            assert.strictEqual(typeof buf, 'string');
            const obj = JSON.parse(buf);
            assert(Array.isArray(obj));
            assert(stream.isClosed);
        });
    });

    it('should stream row object if objectMode enabled', async function () {
        await client.acquire(async (session: SqbConnection) => {
            const result = await session.execute(Select().from('customers'));
            cursor = result && result.cursor;
            const stream = cursor.toStream({objectMode: true});
            const arr = await readObjectStream(stream);
            assert(Array.isArray(arr));
            assert(stream.isClosed);
        });
    });

    it('should cursor.close() also close the stream', function (done) {
        client.acquire(async (session: SqbConnection) => {
            const result = await session.execute(Select().from('customers'));
            cursor = result && result.cursor;
            const stream = cursor.toStream();
            stream.on('close', () => done());
            await cursor.close();
        }).catch(done);
    });

    it('should handle cursor errors', function (done) {
        client.acquire(async (session: SqbConnection) => {
            const result = await session.execute(Select().from('customers'));
            cursor = result && result.cursor;
            (cursor as any)._intlcur.close = () => Promise.reject(new Error('Any error'));
            const stream = cursor.toStream();
            stream.once('error', () => {
                delete result.cursor._intlcur.close;
                stream.close().then(done).catch(done);
            });
            stream.close().catch(() => 0);
        }).catch(done);
    });

});
