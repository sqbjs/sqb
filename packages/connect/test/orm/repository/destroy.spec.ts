import {SqbClient} from '@sqb/connect';
import {Customer} from '../../_support/customer.entity.js';
import {initClient} from '../../_support/init-client.js';

describe('Repository / destroy()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should delete single record (key value as argument)', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client.getRepository<Customer>(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        let c2 = await repo.count();
        expect(c2).toStrictEqual(c + 1);
        await repo.destroy(customer.id);
        c2 = await repo.count();
        expect(c2).toStrictEqual(c);
    });

    it('should delete single record (entity instance as argument)', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client.getRepository<Customer>(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        let c2 = await repo.count();
        expect(c2).toStrictEqual(c + 1);
        await repo.destroy(customer.id);
        c2 = await repo.count();
        expect(c2).toStrictEqual(c);
    });

    it('should execute in transaction', async function () {
        let c = 0;
        return client.acquire(async (connection) => {
            const values = {
                givenName: 'Abc',
                familyName: 'Def',
                countryCode: 'DE'
            };
            const repo = connection.getRepository<Customer>(Customer);
            const customer = await repo.create(values);
            c = await repo.count();
            await connection.startTransaction();
            await repo.destroy(customer.id);
            let c2 = await repo.count();
            expect(c2).toStrictEqual(c - 1);
            await connection.rollback();
            c2 = await repo.count();
            expect(c2).toStrictEqual(c);
        });
    });

});

describe('destroyAll()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should delete multiple records by filter', async function () {
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
        expect(c2).toStrictEqual(c + 3);
        await repo.destroyAll({filter: {city: 'unknown'}});
        c2 = await repo.count();
        expect(c2).toStrictEqual(c);
    });

});