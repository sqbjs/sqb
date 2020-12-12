import '../_support/env';
import assert from 'assert';
import {Readable} from 'stream';
import {Select} from '@sqb/builder';
import {Client, Cursor} from '@sqb/connect';
import {Connection} from '../../src/client/Connection';
import {createTestSchema} from '../../../postgres/test/_support/create-test-db';

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

    let client: Client;
    let cursor: Cursor;

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async () => {
            this.timeout(30000);
            await createTestSchema();
        })
    }

    before(() => {
        if (!client)
            client = new Client({dialect: 'postgres', defaults: {cursor: true, objectRows: true}});
    });
    after(async () => {
        if (client)
            await client.close(0);
        client = undefined;
    });

    it('should stream string buffer', async function () {
        await client.acquire(async (session: Connection) => {
            const result = await session.execute(Select().from('airports'));
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
        await client.acquire(async (session: Connection) => {
            const result = await session.execute(Select().from('airports'));
            cursor = result && result.cursor;
            const stream = cursor.toStream({objectMode: true});
            const arr = await readObjectStream(stream);
            assert(Array.isArray(arr));
            assert(stream.isClosed);
        });
    });

    it('should cursor.close() also close the stream', function(done) {
        client.acquire(async (session: Connection) => {
            const result = await session.execute(Select().from('airports'));
            cursor = result && result.cursor;
            const stream = cursor.toStream();
            stream.on('close', () => done());
            await cursor.close();
        }).catch(done);
    });

    it('should handle cursor errors', function(done) {
        client.acquire(async (session: Connection) => {
            const result = await session.execute(Select().from('airports'));
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
