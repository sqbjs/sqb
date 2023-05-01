/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqbClient} from '@sqb/connect';
import {Customer} from '../../_support/customer.entity.js';
import {initClient} from '../../_support/init-client.js';
import {Tag} from '../../_support/tags.entity.js';

describe('Repository / create()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should insert new record and return new values', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client.getRepository(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        expect(customer).toBeDefined();
        // noinspection SuspiciousTypeOfGuard
        expect(customer instanceof Customer).toBeTruthy();
        expect(customer.id).toBeDefined();
        expect(customer.id).toBeGreaterThan(0);
        expect(customer.givenName).toStrictEqual(values.givenName);
        expect(customer.familyName).toStrictEqual(values.familyName);
        expect(customer.countryCode).toStrictEqual(values.countryCode);
        const x = await repo.find(customer.id, {
            pick: ['id', 'givenName', 'familyName', 'countryCode', 'country']
        });
        const c2 = await repo.count();
        expect(x).toBeDefined();
        expect(c2).toStrictEqual(c + 1);
        expect(x!.id).toStrictEqual(customer.id);
        expect(x!.givenName).toStrictEqual(values.givenName);
        expect(x!.familyName).toStrictEqual(values.familyName);
        expect(x!.countryCode).toStrictEqual(values.countryCode);
        expect(x!.country!.code).toStrictEqual(values.countryCode);
    });

    it('should insert new record with json object field', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR',
            customData: {test: Math.trunc(Math.random() * 10000)}
        }
        const repo = client.getRepository(Customer);
        const customer = await repo.create(values);
        expect(customer).toBeDefined();
        expect(customer.customData).toStrictEqual(values.customData);
    });

    it('should apply column.serialize() before insert', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR',
            gender: 'Male'
        }
        const repo = client.getRepository<Customer>(Customer);
        const customer = await repo.create(values);
        expect(customer).toBeDefined();
        const x = await repo.find(customer.id, {pick: ['id', 'gender']});
        expect(x).toBeDefined();
        expect(x!.id).toStrictEqual(customer.id);
        expect(x!.gender).toStrictEqual('Male');
    });

    it('should map embedded elements into fields', async function () {
        const values = {
            name: {
                given: 'G' + Math.trunc(Math.random() * 10000),
                family: 'F' + Math.trunc(Math.random() * 10000),
            },
            countryCode: 'TR'
        }
        const repo = client.getRepository(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        expect(customer).toBeDefined();
        // noinspection SuspiciousTypeOfGuard
        expect(customer instanceof Customer).toBeTruthy();
        expect(customer.id).toBeDefined();
        expect(customer.id).toBeGreaterThan(0);
        expect({...customer.name}).toStrictEqual(values.name);
        const x = await repo.find(customer.id, {
            pick: ['id', 'name']
        });
        const c2 = await repo.count();
        expect(x).toBeDefined();
        expect(c2).toStrictEqual(c + 1);
        expect(x!.id).toStrictEqual(customer.id);
        expect({...x!.name}).toStrictEqual(values.name);
    });

    it('should set default value', async function () {
        const values = {
            name: {
                given: 'G' + Math.trunc(Math.random() * 10000),
                family: 'F' + Math.trunc(Math.random() * 10000),
            },
            countryCode: 'TR'
        }
        const repo = client.getRepository(Customer);
        const customer = await repo.create(values);
        expect(customer).toBeDefined();
        expect(customer.active).toStrictEqual(true);
    });

    it('should check enum value', async function () {
        const repo = client.getRepository(Tag);
        await expect(() => repo.create({name: 'small', color: 'pink'}))
            .rejects.toThrow('value must be one of');
    });

    it('should check column is required', async function () {
        const repo = client.getRepository(Customer);
        await expect(() => repo.create({givenName: 'aa', familyName: 'bb'}))
            .rejects.toThrow('is required');
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
            c = await repo.count();
            await connection.startTransaction();
            await repo.create(values);
            let c2 = await repo.count();
            expect(c2).toStrictEqual(c + 1);
            await connection.rollback();
            c2 = await repo.count();
            expect(c2).toStrictEqual(c);
        });
    });

});

describe('createOnly()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should not generate "returning" sql query for fast execution', async function () {
        return client.acquire(async (connection) => {
            const values = {
                givenName: 'Abc',
                familyName: 'Def',
                countryCode: 'DE'
            };
            const repo = connection.getRepository(Customer);
            let sql = '';
            connection.on('execute', req => {
                sql = req.sql;
            });
            await repo.createOnly(values);
            expect(sql.includes('returning')).toBeFalsy();
        });
    });

});
