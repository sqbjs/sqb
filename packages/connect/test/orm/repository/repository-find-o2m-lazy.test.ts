import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {SqbClient} from '@sqb/connect';
import {Eq} from '@sqb/builder';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';

describe('findAll() One-2-Many lazy', function () {

    let client: SqbClient;
    before(() => client = initClient());

    it('should resolve records async', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [Eq('code', 'DE')],
            elements: ['code', 'customersLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].code, 'DE');

        const customers = await rows[0].customersLazy();
        assert.ok(Array.isArray(customers));
        assert.ok(customers.length);
        for (const customer of customers) {
            assert.ok(customer.givenName);
            assert.strictEqual(customer.countryCode, 'DE');
        }
    });

    it('should specify returning columns', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [Eq('code', 'DE')],
            elements: ['code', 'customersLazy.countryCode']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].code, 'DE');

        const customers = await rows[0].customersLazy();
        assert.ok(Array.isArray(customers));
        assert.ok(customers.length);
        for (const customer of customers) {
            assert.strictEqual(customer.givenName, undefined);
            assert.strictEqual(customer.countryCode, 'DE');
        }
    });

    it('should sort in lazy resolver function', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [Eq('code', 'DE')],
            elements: ['code', 'customersLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].code, 'DE');

        const customers = await rows[0].customersLazy({sort: ['givenName']});
        const arr1 = customers.map(c => c.givenName);
        const arr2 = [...arr1];
        arr2.sort();
        assert.deepStrictEqual(arr1, arr2);
    });

    it('should limit in lazy resolver function', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [Eq('code', 'DE')],
            elements: ['code', 'customersLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].code, 'DE');

        const customers = await rows[0].customersLazy({limit: 2});
        assert.deepStrictEqual(customers.length, 2);
    });

    it('should start from offset in lazy resolver function', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [Eq('code', 'DE')],
            elements: ['code', 'customersLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].code, 'DE');

        const customers = await rows[0].customersLazy({limit: 2});
        assert.deepStrictEqual(customers.length, 2);
    });

    it('should specify returning elements in lazy resolver function', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [Eq('code', 'DE')],
            elements: ['code', 'customersLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].code, 'DE');

        const customers = await rows[0].customersLazy({limit: 1, elements: ['givenName']});
        assert.deepStrictEqual(Object.keys(customers[0]), ['givenName']);
    });
});
