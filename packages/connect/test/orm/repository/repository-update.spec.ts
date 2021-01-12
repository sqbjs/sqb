import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Customer} from '../../_support/customers.entity';
import {initClient} from '../../_support/init-client';
import {In} from '@sqb/builder';

describe('Repository "update" operations', function () {

    const client = initClient();
    const ids: number[] = [];

    const createCustomer = async function (values?: any): Promise<Customer> {
        const v = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            ...values
        }
        const repo = client.getRepository<Customer>(Customer);
        return await repo.create(v);
    }

    /**
     *
     */
    describe('update()', function () {

        it('should update and return updated columns', async function () {
            const customer = await createCustomer();
            ids.push(customer.id);

            const repo = client.getRepository<Customer>(Customer);
            const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
            const updated = await repo.update({
                id: ids[0],
                givenName: newGivenName
            });

            assert.ok(updated);
            assert.strictEqual(updated.id, ids[0]);
            assert.strictEqual(updated.givenName, newGivenName);
            assert.notStrictEqual(updated.givenName, customer.givenName);

            const c2 = await repo.get(ids[0]);
            assert.strictEqual(updated.id, c2.id);
            assert.strictEqual(updated.givenName, c2.givenName);
            assert.notStrictEqual(updated.familyName, c2.familyName);

        });

        it('should return auto generated columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
            const updated = await repo.update({
                id: ids[0],
                givenName: newGivenName
            });
            assert.ok(updated);
            assert.ok(updated.updatedAt);

            const c2 = await repo.get(ids[0]);
            assert.strictEqual(c2.id, updated.id);
            assert.strictEqual(c2.givenName, updated.givenName);
            assert.notStrictEqual(c2.familyName, updated.familyName);
            assert.notStrictEqual(c2.updatedAt, updated.updatedAt);
        });

        it('should work within transaction', async function () {
            return client.acquire(async (connection) => {
                const repo = connection.getRepository<Customer>(Customer);
                const c1 = await repo.get(ids[0]);

                await connection.startTransaction();
                const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
                const updated = await repo.update({
                    id: ids[0],
                    givenName: newGivenName
                });
                assert.strictEqual(updated.givenName, newGivenName);

                await connection.rollback();
                const c2 = await repo.get(ids[0]);
                assert.strictEqual(c2.givenName, c1.givenName);
            });
        });

    });

    describe('updateOnly()', function () {

        it('should return true if update success', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const newGivenName = 'G' + Math.trunc(Math.random() * 10000);
            let success = await repo.updateOnly({
                id: ids[0],
                givenName: newGivenName
            });
            assert.strictEqual(success, true);

            success = await repo.updateOnly({
                id: 0,
                givenName: newGivenName
            });
            assert.strictEqual(success, false);

            const c2 = await repo.get(ids[0]);
            assert.strictEqual(c2.id, ids[0]);
            assert.strictEqual(c2.givenName, newGivenName);
        });

        it('should not use "returning" query for fast execution', async function () {
            return client.acquire(async (connection) => {
                const repo = connection.getRepository<Customer>(Customer);
                let sql = '';
                connection.on('execute', req => {
                    sql = req.sql;
                });
                await repo.updateOnly({
                    id: ids[0],
                    givenName: 'any name'
                });
                assert.ok(!sql.includes('returning'));
            });
        });

    })

    describe('updateAll()', function () {

        it('should update multiple rows', async function () {
            const oldCity = 'C' + Math.trunc(Math.random() * 10000);
            for (let i = 0; i < 10; i++) {
                const customer = await createCustomer({city: oldCity});
                ids.push(customer.id);
            }
            const repo = client.getRepository<Customer>(Customer);
            const newCity = 'C' + Math.trunc(Math.random() * 10000);
            const count = await repo.updateAll({city: newCity}, {filter: In('id', ids)});
            assert.strictEqual(count, ids.length);
            const rows = await repo.findAll({filter: In('id', ids)});
            for (const row of rows) {
                assert.strictEqual(row.city, newCity);
            }
        });

    })

});
