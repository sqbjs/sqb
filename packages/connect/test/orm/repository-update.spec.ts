import '../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Customer} from '../_support/customers.entity';
import {initClient} from '../_support/init-client';

describe('Repository "update" operations', function () {

    const client = initClient();
    let lastId: number;

    /**
     *
     */
    describe('update()', function () {

        it('update and return updated columns', async function () {
            const values = {
                givenName: 'G' + Math.trunc(Math.random() * 10000),
                familyName: 'F' + Math.trunc(Math.random() * 10000),
                countryCode: 'TR'
            }
            const repo = client.getRepository<Customer>(Customer);
            const customer = await repo.create(values);
            lastId = customer.id;

            const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
            const updated = await repo.update({
                id: lastId,
                givenName: newGivenName
            });

            assert.ok(updated);
            assert.strictEqual(updated.id, lastId);
            assert.strictEqual(updated.givenName, newGivenName);
            assert.notStrictEqual(updated.givenName, customer.givenName);
        });

        it('return auto generated columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
            const updated = await repo.update({
                id: lastId,
                givenName: newGivenName
            });
            assert.ok(updated);
            assert.ok(updated.updatedAt);
        });

        it('should work within transaction', async function () {
            return client.acquire(async (connection) => {
                const repo = connection.getRepository<Customer>(Customer);
                const c1 = await repo.get(lastId);

                await connection.startTransaction();
                const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
                const updated = await repo.update({
                    id: lastId,
                    givenName: newGivenName
                });
                assert.strictEqual(updated.givenName, newGivenName);

                await connection.rollback();
                const c2 = await repo.get(lastId);
                assert.strictEqual(c1.givenName, c2.givenName);
            });
        });

    });

    describe('updateOnly()', function () {

        it('return true if update success', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
            let success = await repo.updateOnly({
                id: lastId,
                givenName: newGivenName
            });
            assert.strictEqual(success, true);

            success = await repo.updateOnly({
                id: 0,
                givenName: newGivenName
            });
            assert.strictEqual(success, false);
        });

        it('should not use "returning" query for fast execution', async function () {
            return client.acquire(async (connection) => {
                const repo = connection.getRepository<Customer>(Customer);
                let sql = '';
                connection.on('execute', req => {
                    sql = req.sql;
                });
                await repo.updateOnly({
                    id: lastId,
                    givenName: 'any name'
                });
                assert.ok(!sql.includes('returning'));
            });
        });

    })

    describe('updateAll()', function () {
//
    })

});
