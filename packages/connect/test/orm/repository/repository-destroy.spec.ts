import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Customer} from '../../_support/customers.entity';
import {initClient} from '../../_support/init-client';

const client = initClient();

describe('destroy() method', function () {

    it('should destroy single instance (entity instance as argument)', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client.getRepository<Customer>(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        let c2 = await repo.count();
        assert.strictEqual(c2, c + 1);
        await repo.destroy(customer);
        c2 = await repo.count();
        assert.strictEqual(c2, c);
    });

    it('should destroy single instance (key value as argument)', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client.getRepository<Customer>(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        let c2 = await repo.count();
        assert.strictEqual(c2, c + 1);
        await repo.destroy(customer.id);
        c2 = await repo.count();
        assert.strictEqual(c2, c);
    });

    it('should work within transaction', async function () {
        let c = 0;
        return client.acquire(async (connection) => {
            const values = {
                givenName: 'abc',
                familyName: 'def'
            };
            const repo = connection.getRepository<Customer>(Customer);
            const customer = await repo.create(values);
            c = await repo.count();
            await connection.startTransaction();
            await repo.destroy(customer);
            let c2 = await repo.count();
            assert.strictEqual(c2, c - 1);
            await connection.rollback();
            c2 = await repo.count();
            assert.strictEqual(c2, c);
        });
    });

});

describe('destroyAll() method', function () {

    it('destroy by filter', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'US',
            city: 'unknown'
        }
        const repo = client.getRepository<Customer>(Customer);
        const c = await repo.count();
        await repo.createOnly(values);
        await repo.createOnly(values);
        await repo.createOnly(values);
        let c2 = await repo.count();
        assert.strictEqual(c2, c + 3);
        await repo.destroyAll({filter: {city: 'unknown'}});
        c2 = await repo.count();
        assert.strictEqual(c2, c);
    });

});
